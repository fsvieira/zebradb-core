const {
    varGenerator, 
    type,
    get,
    copyTerm,
    toString,
    getVariable,
    getConstantVarname
} = require("./base");

const constants = require("./constants");

const {
    checkVariableConstrains,
    setVariable
} = require("./built-in/constraints.js");

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
        OR, // "or",
        AND, // "and",
        IN, // "in",
        UNIFY, // "=",
        NOT_UNIFY, // "!=",
        UNION, // "union",
        ADD, // '+',
        SUB, // '-',
        MUL, // '*'
    }
} = constants;


const doNotUnify = require("./notUnify");

const C_FALSE = 0;
const C_TRUE = 1;
const C_UNKNOWN = 2;

/*
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

async function checkConstrainNotUnifyLocalVarConstant (ctx, a, b, cs) {
    if (a.domain) {
        const domain = await getVariable(null, a.domain, ctx);

        if (domain.type === SET) {
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
                    // 1. create a new domain variable, 
                    const id = ctx.newVar();
                    const s = {
                        type: SET,
                        elements: es,
                        id,
                        size: es.length
                    };

                    ctx.variables = await ctx.variables.set(id, s);

                    // 2. remove a constrains,
                    const constraints = await a.constraints.remove(cs.id);

                    // 3. save modifications,
                    ctx.variables = await ctx.variables.set(a.id, {
                        ...a, 
                        constraints: constraints.size === 0?undefined:constraints,
                        domain: id
                    });
                }
            }

            // 4. set constraint to true,
            const vc = await getConstant(ctx, '1');
            const ok = await setVariable(ctx, cs, vc);
    
            if (ok) {
                return C_TRUE;
            }
            else {
                return C_FALSE;
            }
        }
        else {
            throw `checkConstrainNotUnifyLocalVarConstant: Not implemented for domain type ${domain.type}!`;
        }
    }

    return C_UNKNOWN; 
}

async function checkConstrainNotUnifyConstantConstant (ctx, a, b) {
    return a.id != b.id ? C_TRUE : C_FALSE;
}

async function checkConstrainConstantUnknown (ctx, c) {
    const v = parseFloat(c.data);

    if (isNaN(v)) {
        return C_FALSE;
    }

    // throw JSON.stringify(a) + " --- " + JSON.stringify(b);
    return C_UNKNOWN;
}

async function getConstant (ctx, string) {
    const vID = getConstantVarname(string);

    if (!(await ctx.variables.has(vID))) {
        const c = {
            type: CONSTANT,
            data: string,
            id: vID
        };

        ctx.variables = await ctx.variables.set(vID, c);

        return c;
    }

    return await ctx.variables.get(vID);
}

async function checkConstrainSubConstantConstant (ctx, a, b, cs) {
    const r = parseFloat(a.data) - parseFloat(b.data);

    if (!isNaN(r)) {
        // get or create constant value,
        const vc = await getConstant(ctx, r.toString());

        const ok = await setVariable(ctx, cs, vc);

        if (ok) {
            return C_TRUE;
        }
    }

    return C_FALSE;
}

async function checkConstrainMulConstantConstant (ctx, a, b, cs) {
    const r = parseFloat(a.data) * parseFloat(b.data);

    if (!isNaN(r)) {
        // get or create constant value,
        const vc = await getConstant(ctx, r.toString());

        const ok = await setVariable(ctx, cs, vc);

        if (ok) {
            return C_TRUE;
        }
    }

    return C_FALSE;
}

async function checkConstrainAddConstantConstant(ctx, a, b, cs) {
    const r = parseFloat(a.data) + parseFloat(b.data);

    if (!isNaN(r)) {
        // get or create constant value,
        const vc = await getConstant(ctx, r.toString());

        const ok = await setVariable(ctx, cs, vc);

        if (ok) {
            return C_TRUE;
        }
    }

    return C_FALSE;
}

async function checkConstrainUnifyLocalVarConstant (ctx, lv, c, cs) {

    const ok = await setVariable(ctx, lv, c);

    return ok?C_TRUE:C_FALSE;
    
}

async function checkConstrainUnifyConstantConstant (ctx, a, b, cs) {

    if (a.id === b.id) {
        const vc = await getConstant(ctx, '1');
        const ok = await setVariable(ctx, cs, vc);

        if (ok) {
            return C_TRUE;
        }

    }

    return C_FALSE;
}

async function checkConstrainAndConstantConstant (ctx, a, b, cs) {
    if (a.data === b.data && b.data==='1') {
        const ok = await setVariable(ctx, cs, a);

        if (ok) {
            return C_TRUE;
        }
    }

    return C_FALSE;
}
*/
/* TODO: MAYBE FOR LATER ??
async function checkConstrainMulLocalVarConstant (ctx, v, c, cs) {
    const value = parseFloat(c.data);

    if (isNaN(value)) {
        // c must be a number,
        return C_FALSE;
    }

    if (v.domain) {
            1. if domain we can create a new domain where all values are multiplied by c.
            2. if domain is not finit it would be more complicated. 
            3. if domain is not numeric it should fail.

            Notes: calculating possible values may help to reduce the options if 
            there is other constraints that would restrict the possible values. 
         
          
        const domain = await getVariable(null, v.domain, ctx);

        if (domain.type === SET) {
            const newDomain = [];
            for (let i=0; i<domain.elements.length; i++) {
                const c = await getVariable(null, domain.elements[i], ctx);
                if (c.type === CONSTANT) {
                    const dValue = parseFloat(c.data);

                    if (!isNaN(dValue)) {
                        newDomain.push(value * dValue);
                    }
                }
                else {
                    throw 'checkConstrainMulLocalVarConstant Domain Element type ' + c.type;
                }
            }

            // 1. create new domain and update local variable,
            // 2. replace/defer cs to local variable,
            // 3. process...

            throw 'NEW DOMAIN!!';
        }
        else {
            throw 'checkConstrainMulLocalVarConstant: check domain case!!';
        }
    }

    return C_UNKNOWN;
}*/ 

/*
const constrainsFn = {
    [NOT_UNIFY]: {
        [LOCAL_VAR]: {
            [CONSTANT]: checkConstrainNotUnifyLocalVarConstant
        },
        [CONSTANT]: {
            [CONSTANT]: checkConstrainNotUnifyConstantConstant,
            [CONSTRAINT]: checkConstrainConstantUnknown,
            [LOCAL_VAR]: (ctx, c, lv, ...args) => 
                constrainsFn[NOT_UNIFY][LOCAL_VAR][CONSTANT](ctx, lv, c, ...args) 
        }
    },
    [UNIFY]: {
        [CONSTANT]: {
            [CONSTRAINT]: () => C_UNKNOWN, // checkConstrainConstantUnknown,
            [CONSTANT]: checkConstrainUnifyConstantConstant
        },
        [LOCAL_VAR]: {
            [CONSTANT]: checkConstrainUnifyLocalVarConstant
        },
        [CONSTRAINT]: {
           [CONSTANT]: () => C_UNKNOWN
        }

    },
    [AND]: {
        [CONSTANT]: {
            [CONSTRAINT]: checkConstrainConstantUnknown,
            [CONSTANT]: checkConstrainAndConstantConstant
        },
        [CONSTRAINT]: {
            [CONSTANT]: (ctx, cs, c, ...args) => 
                constrainsFn[AND][CONSTANT][CONSTRAINT](ctx, c, cs, ...args)
        }
    },
    [MUL]: {
        [CONSTANT]: {
            [CONSTRAINT]: checkConstrainConstantUnknown,
            [CONSTANT]: checkConstrainMulConstantConstant
        },
        [LOCAL_VAR]: {
            [CONSTANT]: (ctx, lv, c) => checkConstrainConstantUnknown(ctx, c) // checkConstrainMulLocalVarConstant
        }
    },
    [SUB]: {
        [CONSTANT]: {
            [LOCAL_VAR]: checkConstrainConstantUnknown,
            [CONSTRAINT]: checkConstrainConstantUnknown,
            [CONSTANT]: checkConstrainSubConstantConstant
        }
    },
    [ADD]: {
        [CONSTANT]: {
            [CONSTRAINT]: checkConstrainConstantUnknown,
            [CONSTANT]: checkConstrainAddConstantConstant,
            [LOCAL_VAR]: checkConstrainConstantUnknown
        },
        [CONSTRAINT]: {
            [CONSTANT]: (ctx, cs, c, ...args) => 
                constrainsFn[ADD][CONSTANT][CONSTRAINT](ctx, c, cs, ...args)
        },
        [LOCAL_VAR]: {
            [CONSTANT]: (ctx, lv, c, ...args) => 
                constrainsFn[ADD][CONSTANT][LOCAL_VAR](ctx, c, lv, ...args)
        }
    }
}

async function checkConstrain(ctx, cs) {
    if (cs.type === CONSTANT) {
        if (cs.data === '1') {
            return C_TRUE;
        }

        return C_FALSE;
    }

    const {a, op, b, id} = cs;


    const av = await getVariable(null, a, ctx);
    const bv = await getVariable(null, b, ctx);

    try {
        const fn = constrainsFn[op][av.type][bv.type];
        return await fn(ctx, av, bv, cs);
    }
    catch (e) {
        console.log(e);
        console.log(`checkConstrain: ${op} ${av.type} ${bv.type} !!`);
        throw `checkConstrain: ${op} ${av.type} ${bv.type} !!`;
    } 

}*/

/*
async function checkVariableConstrains (ctx, v) {
    for await (let vcID of v.constraints.values()) {
        const cs = await getVariable(null, vcID, ctx);

        const r = await checkConstrain(ctx, cs);

        if (r === C_FALSE) {
            return false;
        }
    }

    return true;
}*/

/*
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
*/
/*
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

    return true;
}*/

/*
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
    }

    return true;
}
*/

async function setVariableConstraintConstant (ctx, cs, c) {
    console.log("CCCCCCCCCCCCCCCCCC ", c);
    ctx.variables = await ctx.variables.set(cs.id, {...cs, defer: c.id});

    if (cs.constraints) {
        const r = await checkVariableConstrains(ctx, cs);

        if (r === false) {
            return r;
        }
    }

    return true;

}

/*
const setVariableFn = {
    [LOCAL_VAR]: {
        [LOCAL_VAR]: setVariableLocalVarLocalVar,
        [CONSTANT]: setVariableLocalVarConstant
    },
    [CONSTRAINT]: {
        [CONSTANT]: setVariableConstraintConstant
    }
}*/

const unifyFn = {
    [LOCAL_VAR]: {
        [LOCAL_VAR]: setVariable,
        [TUPLE]: setVariable, // !p.d && await unifyVariable(ctx, p, q),
        [CONSTANT]: setVariable, // async (ctx, p, q) => (!p.d || (p.d && p.d.includes(q.id))) && await unifyVariable(ctx, p, q)
    },
    [TUPLE]: {
        [LOCAL_VAR]: async (ctx, p, q) => unifyFn[LOCAL_VAR][TUPLE](ctx, q, p),
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
        [LOCAL_VAR]: async (ctx, p, q) => unifyFn[LOCAL_VAR][CONSTANT](ctx, q, p),
        [TUPLE]: async () => false,
        [CONSTANT]: async (ctx, p, q) => p.data === q.data
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
}

module.exports = {unify, constants};