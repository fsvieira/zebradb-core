const {
    varGenerator, 
    type,
    get,
    copyTerm,
    toString,
    getVariable
} = require("./base");

const constants = require("./constants");

const {
    type: {
        CONSTANT, // : "c",
        TUPLE, // : "t",
        CONSTRAINT, // : "cs",
        SET, // : "s",
        LOCAL_VAR, // : 'lv',
        GLOBAL_VAR, // : 'gv',
        DEF_REF // d
    },
    operation: {
        OR, // : "or",
        AND, // : "and",
        IN, // : "in",
        UNIFY, // : "=",
        NOT_UNIFY, // : "!="
    }
} = constants;


const doNotUnify = require("./notUnify");

const C_FALSE = 0;
const C_TRUE = 1;
const C_UNKNOWN = 2;

const __checkConstrains = async (ctx, c, or) => {
    if (c.op === '!=') {
        const [p, q] = await Promise.all(c.args.map(id => getVariable(null, id, ctx)));
        const ok = p.id !== q.id;

        if (ok && !(p.v || q.v)) {
            if (p.t && q.t) {
                const [ok, cs] = await doNotUnify(ctx, p.id, q.id);

                if (!ok) {
                    if (cs.length) {
                        const vcs = or?.id || ctx.newVar();

                        let orConstrains = or ? or.args : ctx.rDB.iSet();
                        for (let i=0; i<cs.length; i++) {
                            const vc = ctx.newVar();
                            const [pID, qID] = cs[i].args;

                            console.log(vc, vcs);

                            const p = await getVariable(null, pID, ctx);
                            const q = await getVariable(null, qID, ctx);

                            const pe = await (p.e || ctx.rDB.iSet()).add(vcs);
                            const qe = await (q.e || ctx.rDB.iSet()).add(vcs);

                            if (p.d) {
                                ctx.unsolvedVariables = await ctx.unsolvedVariables.add(p.id);
                            }

                            if (q.d) {
                                ctx.unsolvedVariables = await ctx.unsolvedVariables.add(q.id);
                            }

                            ctx.variables = await ctx.variables.set(p.id, {...p, e: pe});
                            ctx.variables = await ctx.variables.set(q.id, {...q, e: qe});

                            ctx.variables = await ctx.variables.set(vc, cs[i]);
                            orConstrains = await orConstrains.add(vc);
                        }
                        
                        if (or) {
                            or.args = orConstrains;
                        }
                        else {
                            ctx.variables = await ctx.variables.set(vcs, {op: "OR", args: orConstrains, id: vcs});
                            ctx.constraints = await ctx.constraints.add(vcs);
                        }
                    }
                    else {
                        // tuples are equal so they should fail.
                        return C_FALSE;
                    }
                }
            }

            return C_TRUE;
            // if ok, and both p and q are not variables,
            // we can remove constrain,
              // ctx.constraints = await ctx.constraints.remove(c.id);
              // e = await e.remove(c.id);

            // There is no advantage to remove constraint variable from variables...
        }

        return ok ? C_UNKNOWN : C_FALSE;
    }
    else if (c.op === 'OR') {
        const cs = c.args;
        const cc = {...c};
        for await (let cid of cs.values()) {
            const cOR = await getVariable(null, cid, ctx);
         
            const ok = await checkConstrains(ctx, cOR, cc);

            if (ok === C_FALSE) {
                cc.args = await cc.args.remove(cid);

                if (cc.args.size === 0) {
                    return C_FALSE;
                }
            }
            else if (ok === C_TRUE) {
                ctx.variables = await ctx.variables.set(c.id, {op: 'T', id: c.id});
                return C_TRUE;
            }
        }

        if (cc.args.id !== c.args.id) {
            ctx.variables = await ctx.variables.set(c.id, cc);
        }

        return C_UNKNOWN;
    }
    else if (c.op === 'T') {
        return C_TRUE;
    }

    throw `Unknown operator ${op}!!`;
}

async function checkConstrainNotUnifyLocalVarConstant (ctx, a, b) {
    if (a.domain) {
        const domain = await getVariable(null, a.domain, ctx);
        const index = domain.elements.findIndex(vID => vID === b.id);
        if (index >= 0) {
            const es = domain.elements.slice();
            es.splice(index, 1);

            if (es.length === 1) {
                const v = await getVariable(null, es[0], ctx);

                const r = await setVariableLocalVarConstant(ctx, a, v);

                return r?C_TRUE:C_FALSE;
            }
            else {
                throw `checkConstrainNotUnifyLocalVarConstant: Not implemented!`;
            }
        }
        else {
            return C_TRUE;
        }
    }

    return C_UNKNOWN; 
}

async function checkConstrainNotUnifyConstantConstant (ctx, a, b) {
    return a.id != b.id ? C_TRUE : C_FALSE;
}


const constrainsFn = {
    [NOT_UNIFY]: {
        [LOCAL_VAR]: {
            [CONSTANT]: checkConstrainNotUnifyLocalVarConstant
        },
        [CONSTANT]: {
            [CONSTANT]: checkConstrainNotUnifyConstantConstant
        }
    }
}

async function checkConstrain(ctx, cs) {
    const {a, op, b, id} = cs;

    const av = await getVariable(null, a, ctx);
    const bv = await getVariable(null, b, ctx);

    console.log(`checkConstrain: ${op} ${av.type} ${bv.type} !!`);
    const fn = constrainsFn[op][av.type][bv.type];

    return await fn(ctx, av, bv);
}

async function checkVariableConstrains (ctx, v) {
    console.log(v);

    for await (let vcID of v.constraints.values()) {
        const cs = await getVariable(null, vcID, ctx);

        console.log(vcID, cs);
        const r = await checkConstrain(ctx, cs);

        if (r === C_FALSE) {
            return false;
        }

        console.log(r);
    }

    return true;
    // throw "checkVariableConstrains : Not Implemented"
}

async function intersectDomains(ctx, a, b) {
    if (a.domain && b.domain) {

        if (a.domain === b.domain) {
            return a.domain;
        }
        else {
            throw 'Domain A x B';
        }
    }

    return b.domain || a.domain;
    
}

async function setVariableLocalVarLocalVar (ctx, v, p) {
    let a = p.pv ? p : v;
    let b = p.pv ? v : p;

    const domain = await intersectDomains(ctx, a, b);

    console.log("TODO: check if domain is empty, it should fail!!");

    const aDomain = (domain && a.domain !== domain)?domain:null;

    let aConstraints;
    if (b.constraints) {
        if (!a.constraints) {
            aConstraints = b.constraints;
        }
        else {
            throw 'A AND B has constraints!!';
        }
    }

    if (aDomain || aConstraints) {
        ctx.variables = await ctx.variables.set(a.id, {
            ...a,
            domain: aDomain || a.domain,
            constraints: aConstraints || a.constraints
        });
    }

    ctx.variables = await ctx.variables.set(b.id, {...b, defer: a.id});

    /*if (b.constraints) {
        // throw "Constrains may have been passed to variable A but they can't be removed!!"
       // ctx.unsolvedVariables = await ctx.unsolvedVariables.remove(b.id);
    }*/

//    throw `FUNCTION ${v.type} x ${p.type} not implemented`;

    return true;
}

async function setVariableLocalVarConstant (ctx, v, c) {
    if (v.domain) {
        const d = await getVariable(null, v.domain, ctx);
        
        switch (d.type) {
            case SET:
                if (!d.elements.includes(c.id)) {
                    return false;
                }

                break;

            default:
                throw `setVariableLocalVarConstant Domain ${d.type} not defined!`;
        }
    }

    ctx.variables = await ctx.variables.set(v.id, {...v, defer: c.id});

    if (v.constraints) {
        const r = await checkVariableConstrains(ctx, v);

        if (r === false) {
            return r;
        }

        // throw 'setVariableLocalVarConstant : Check constraints with new value!';
        // ctx.unsolvedVariables = await ctx.unsolvedVariables.remove(v.id);
    }

    return true;
}

const setVariableFn = {
    [LOCAL_VAR]: {
        [LOCAL_VAR]: setVariableLocalVarLocalVar,
        [CONSTANT]: setVariableLocalVarConstant
    }
}

const setVariable = async (ctx, v, p) => {

    if (v.id !== p.id) {

        if (p.constraints || v.constraints) {
            console.log("PPP");
        }

        console.log("TODO: setVariable not implemented!!");
        
        const fn = setVariableFn[v.type][p.type];
        
        if (!fn) {
            throw `Set Variable ${v.type} x ${p.type} not implemented`
        }

        return fn(ctx, v, p);
    }
    
    return true; 

    if (v.id !== p.id) {
        if (v.d && (p.t || (p.c && !(await v.d.has(p.id))))) {

            // if v has domain, then if value is:
            //        * a tuple, it fails,
            //        * if a constant not in domain, it fails. 
            return false;
        }

        const c = !p.v || p.pv; 
        let a = c ? p : v;
        let b = c ? v : p;

        ctx.variables = await ctx.variables.set(b.id, {v: b.id, defer: a.id});
        ctx.unsolvedVariables = await ctx.unsolvedVariables.remove(b.id);

        let d;
        if (!p.c) { 
            d = a.d || b.d;
            if (a.d && b.d) {
                for await (let c of a.d) {
                    if (!b.d.has(c)) {
                        d = await d.remove(c);

                        if (d.size === 0) {
                            return false;
                        }
                    }
                }
            }
        }

        let e = v.e || p.e;
        if (v.e && p.e) {
            for await (let c of p.e.values()) {
                e = await e.add(c);
            }
        }

        if (e && e.size > 0) {
            const cs = e;
            for await (let condID of cs.values()) {
                const c = await getVariable(null, condID, ctx);
                const ok = await checkConstrains(ctx, c);
                
                if (ok === C_TRUE) {
                    ctx.constraints = await ctx.constraints.remove(c.id);
                    e = await e.remove(c.id);
                }
                else if (ok === C_FALSE) {
                    return false;
                }
            }
        }

        const vin = a.in || b.in;

        if (a.v && (
            (d && (!a.d || a.d.id !== d.id))
            || 
            (e && (!a.e || a.e.id !== e.id))
            || vin
        )) {
            // update a
            ctx.variables = await ctx.variables.set(a.id, {...a, d, e, in: vin});

            if ((d && e) || vin) {
                ctx.unsolvedVariables = await ctx.unsolvedVariables.add(a.id);
            }
        }
    }

    return true;
}


const unifyFn = {
    [LOCAL_VAR]: {
        [LOCAL_VAR]: setVariable,
        [TUPLE]: setVariable, // !p.d && await unifyVariable(ctx, p, q),
        [CONSTANT]: setVariable, // async (ctx, p, q) => (!p.d || (p.d && p.d.includes(q.id))) && await unifyVariable(ctx, p, q)
    },
    [TUPLE]: {
        [LOCAL_VAR]: async (ctx, p, q) => unifyFn.v.t(ctx, q, p),
        [TUPLE]: async (ctx, p, q) => {
            if (p.id !== q.id) {
                if (p.data.length === q.data.length) {
                    for (let i=0; i<p.data.length; i++) {
                        const r = await doUnify(ctx, p.data[i], q.data[i]);

                        if (!r) {
                            return false;
                        }
                    }

                    await checkTuple(ctx, p, q);

                    return true;
                }
                
                return false;
            }

            return true;
        },
        [CONSTANT]: async () => false
    },
    [CONSTANT]: {
        [LOCAL_VAR]: async (ctx, p, q) => unifyFn.v.c(ctx, q, p),
        [TUPLE]: async () => false,
        [CONSTANT]: async (ctx, p, q) => p.c === q.c
    }
}

const checkTuple = async (ctx, p, q) => {
    if (await ctx.checked.has(p.id)) {
        ctx.variables = await ctx.variables.set(q.id, {v: q.id, defer: p.id});
        ctx.unchecked = await ctx.unchecked.remove(q.id);
    }
    else if (await ctx.checked.has(q.id)) {
        ctx.variables = await ctx.variables.set(p.id, {v: p.id, defer: q.id});
        ctx.unchecked = await ctx.unchecked.remove(p.id);
    }
}

async function deepUnify(
    ctx,
    tuple, 
    definitionID,
) {

    const ok = await doUnify(
        ctx,
        tuple, 
        definitionID
    );

    let unsolvedVariablesClean = ctx.unsolvedVariables;

    /*for await (let vid of ctx.unsolvedVariables.values()) {
        const v = await get(ctx, vid);

        if (v.in) {
            for await (let eID of v.in.values()) {
                await doUnify(ctx, v.id, eID);
                // ctx.variables = await ctx.variables.set(v.id, {...v, defer: vin.id});

                unsolvedVariablesClean = await unsolvedVariablesClean.remove(vid);
            }
        }
    }*/

    if (await ctx.unchecked.size === 0 && await ctx.unsolvedVariables.size > 0) {
        // Check if unsolved variables are solved.
        for await (let vid of ctx.unsolvedVariables.values()) {
            const v = await get(ctx, vid);

            if (!(v.constraints && v.domain)) {
                unsolvedVariablesClean = await unsolvedVariablesClean.remove(vid);
            }
        }
    }

    return {
        variables: ctx.variables,
        constraints: ctx.constraints,
        unsolvedVariables: unsolvedVariablesClean,
        unchecked: ctx.unchecked, 
        checked: ctx.checked, 
        fail: !ok, 
        // variableCounter: varCounter(),
        log: ctx.log
    };
}

const doUnify = async (ctx, p, q) => {
    p = await get(ctx, p);
    q = await get(ctx, q);

    console.log("-------->", p, q);
    let s;
    
    if (ctx.options.log) {
        s = `${await toString(undefined, p.id, ctx)} ** ${await toString(undefined, q.id, ctx)}`;
    }

    const ok =  await unifyFn[p.type][q.type](ctx, p, q);

    if (ctx.options.log) {
        const ps = await toString(undefined, p.id, ctx);
        const qs = await toString(undefined, q.id, ctx);

        s += `; p=${ps}, q=${qs}`;
        if (!ok) {
            ctx.log = await ctx.log.push(`FAIL: ${s}`);
        }
        else {
            ctx.log = await ctx.log.push(`SUCC: ${s}`);
        }
    }

    return ok;
}

const __doUnify = async (ctx, p, q) => {
    p = await get(ctx, p);
    q = await get(ctx, q);

    let s;
    
    if (ctx.options.log) {
        s = `${await toString(undefined, p.id, ctx)} ** ${await toString(undefined, q.id, ctx)}`;
    }

    const ok =  await unifyFn[type(p)][type(q)](ctx, p, q);

    if (ctx.options.log) {
        const ps = await toString(undefined, p.id, ctx);
        const qs = await toString(undefined, q.id, ctx);

        s += `; p=${ps}, q=${qs}`;
        if (!ok) {
            ctx.log = await ctx.log.push(`FAIL: ${s}`);
        }
        else {
            ctx.log = await ctx.log.push(`SUCC: ${s}`);
        }
    }

    return ok;
}

async function createBranch (
    fail,
    branch,
    varCounter,
    level,
    checked,
    unchecked,
    variables,
    constraints,
    unsolvedVariables,
    log
) {
    const rDB = branch.table.db;

    let state = 'maybe';

    if (fail) {
        state='no'
    }
    else if (await unchecked.size === 0) {
        if (await unsolvedVariables.size === 0) {
            state='yes';
        }
        else {
            state='unsolved_variables';
            // state='yes';
        }
    }

    const newBranch = await rDB.tables.branches.insert({
        parent: branch,
        root: await branch.data.root,
        variableCounter: varCounter(),
        level,
        checked,
        unchecked,
        variables,
        constraints,
        unsolvedVariables,
        children: [],
        state,
        log
    }, null);

    const children = (await branch.data.children).concat([newBranch]);
    branch.update({children});

    return newBranch;
}

async function unify (branch, options, tuple, definitionID, definition) {

    const level = await branch.data.level + 1;
    const rDB = branch.table.db;

    const {varCounter, newVar} = varGenerator(await branch.data.variableCounter);
    const ctx = {
        variables: await branch.data.variables,
        constraints: await branch.data.constraints,
        unsolvedVariables: await branch.data.unsolvedVariables,
        unchecked: await branch.data.unchecked,
        checked: await branch.data.checked,
        newVar,
        level,
        rDB: branch.table.db,
        branch,
        log: await branch.data.log,
        options  
    };

    if (definition) {
        definitionID = await copyTerm(ctx, definition);
    }

    const {
        variables, constraints, 
        unsolvedVariables, unchecked, 
        checked, fail, log
    } = await deepUnify(
        ctx,
        tuple, 
        definitionID
    );

    await createBranch(
        fail,
        branch,
        varCounter,
        ctx.level,
        checked,
        unchecked,
        variables,
        constraints,
        unsolvedVariables,
        log        
    );

    return branch;
    /*
    let state = 'maybe';

    if (fail) {
        state='no'
    }
    else if (await unchecked.size === 0) {
        if (await unsolvedVariables.size === 0) {
            state='yes';
        }
        else {
            state='unsolved_variables';
        }
    }

    const newBranch = await rDB.tables.branches.insert({
        parent: branch,
        root: await branch.data.root,
        variableCounter: varCounter(),
        level,
        checked,
        unchecked,
        variables,
        constraints,
        unsolvedVariables,
        children: [],
        state,
        log
    }, null);

    const children = (await branch.data.children).concat([newBranch]);
    branch.update({children});

    return branch;*/
}

async function __unify (branch, options, tuple, definitionID, definition) {

    const level = await branch.data.level + 1;
    const rDB = branch.table.db;

    const {varCounter, newVar} = varGenerator(await branch.data.variableCounter);
    const ctx = {
        variables: await branch.data.variables,
        constraints: await branch.data.constraints,
        unsolvedVariables: await branch.data.unsolvedVariables,
        unchecked: await branch.data.unchecked,
        checked: await branch.data.checked,
        newVar,
        level,
        rDB: branch.table.db,
        branch,
        log: await branch.data.log,
        options  
    };

    if (definition) {
        return await getSet(ctx, branch, tuple, definitionID, definition, varCounter);
    }

    const {
        variables, constraints, 
        unsolvedVariables, unchecked, 
        checked, fail, log
    } = await deepUnify(
        ctx,
        tuple, 
        definitionID
    );

    await createBranch(
        fail,
        branch,
        varCounter,
        ctx.level,
        checked,
        unchecked,
        variables,
        constraints,
        unsolvedVariables,
        log        
    );

    return branch;
    /*
    let state = 'maybe';

    if (fail) {
        state='no'
    }
    else if (await unchecked.size === 0) {
        if (await unsolvedVariables.size === 0) {
            state='yes';
        }
        else {
            state='unsolved_variables';
        }
    }

    const newBranch = await rDB.tables.branches.insert({
        parent: branch,
        root: await branch.data.root,
        variableCounter: varCounter(),
        level,
        checked,
        unchecked,
        variables,
        constraints,
        unsolvedVariables,
        children: [],
        state,
        log
    }, null);

    const children = (await branch.data.children).concat([newBranch]);
    branch.update({children});

    return branch;*/
}

module.exports = {unify, constants};