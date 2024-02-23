const {
    varGenerator, 
    type,
    get,
    copyTerm,
    copyPartialTerm,
    toString,
    getVariable,
    getConstantVarname,
    logger,
    getContextState
} = require("./base");

const constants = require("./constants");

const {
    setVariable
} = require("./built-in/constraints.js");

const {
    type: {
        CONSTANT, // : "c",
        TUPLE, // : "t",
        CONSTRAINT, // : "cs",
        SET, // : "s",
        MATERIALIZED_SET, // : "ms"
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

const FN_FALSE = async () => false;

async function unifyMsMs (ctx, p, q) {

    let aSize = await p.elements.size;
    let bSize = await q.elements.size;

    let a=p;
    let b=q;
    if (aSize < bSize) {
        a = q;
        b = p;
        const aTmpSize = aSize;
        aSize = bSize;
        bSize = aTmpSize;
    }

    if (bSize === 0) {
        let {
            defID,
            definition
        } = b;
    
        const {variables, root} = definition;
        defID = defID || root;
        const s = variables[defID];    

        if (s.elements.length === 1) {
            const copyID = s.elements[0];
            for await (let id of a.elements.values()) {
                const eID = await copyPartialTerm(ctx, definition, copyID, null, true);
                await doUnify(ctx, id, eID);
            }
        }
        else {
            throw 'UnifyMsMs : TODO handle sets with more than one element def!';
        }
        
        ctx.variables = await ctx.variables.set(b.id, {
            ...b,
            defer: a.id
        });

        /*
        ctx.unchecked = await ctx.unchecked.remove(q.id);
        ctx.unchecked = await ctx.unchecked.remove(p.id);

        ctx.checked = await ctx.unchecked.add(q.id);
        ctx.checked = await ctx.unchecked.add(p.id);
        */
    }

    return true;
    // throw 'Unify Ms Ms is not defined!!';
}

const unifyFn = {
    [LOCAL_VAR]: {
        [LOCAL_VAR]: setVariable,
        [TUPLE]: setVariable, // !p.d && await unifyVariable(ctx, p, q),
        [CONSTANT]: setVariable, // async (ctx, p, q) => (!p.d || (p.d && p.d.includes(q.id))) && await unifyVariable(ctx, p, q)
        [MATERIALIZED_SET]: setVariable
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
        [CONSTANT]: FN_FALSE,
        [MATERIALIZED_SET]: FN_FALSE
    },
    [CONSTANT]: {
        [LOCAL_VAR]: async (ctx, p, q) => unifyFn[LOCAL_VAR][CONSTANT](ctx, q, p),
        [TUPLE]: async () => false,
        [CONSTANT]: async (ctx, p, q) => p.data === q.data,
        [MATERIALIZED_SET]: FN_FALSE
    },
    [MATERIALIZED_SET]: {
        [LOCAL_VAR]: FN_FALSE,
        [TUPLE]: FN_FALSE,
        [CONSTANT]: FN_FALSE,
        [MATERIALIZED_SET]: unifyMsMs
    }
}

const checkTuple = async (ctx, p, q) => {
    if (await ctx.checked.has(p.id)) {
        ctx.variables = await ctx.variables.set(q.id, {...q, defer: p.id});
        ctx.unchecked = await ctx.unchecked.remove(q.id);
    }
    else if (await ctx.checked.has(q.id)) {
        ctx.variables = await ctx.variables.set(p.id, {...p, defer: q.id});
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
        unsolvedConstraints: ctx.unsolvedConstraints,
        unsolvedVariables: unsolvedVariablesClean,
        setsInDomains: ctx.setsInDomains,
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

    /*
    console.log(
        'DO UNIFY ',
        await toString(null, p.id, ctx), ' ** ', 
        await toString(null, q.id, ctx)
    );*/

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
    options,
    fail,
    branch,
    varCounter,
    level,
    checked,
    unchecked,
    variables,
    constraints,
    unsolvedConstraints,
    unsolvedVariables,
    setsInDomains,
    log
) {
    const rDB = branch.table.db;

    let state = 'maybe';

    if (fail) {
        state='no'
    }
    else {
        state = await getContextState({
            checked,
            unchecked,
            variables,
            constraints,
            unsolvedConstraints,
            unsolvedVariables,
            setsInDomains
        });
    }

    /*(await unchecked.size === 0) {
        if (
            await unsolvedVariables.size === 0 ||
        
        ) {
            state='yes';
        }
        else {
            state='maybe';
            // state='unsolved_variables';
            // state='yes';
        }
    }*/

    const root = await branch.data.root;
    const ctx = {
        parent: branch,
        root,
        variableCounter: varCounter(),
        level,
        checked,
        unchecked,
        variables,
        constraints,
        unsolvedConstraints,
        unsolvedVariables,
        setsInDomains,
        children: [],
        state,
        log
    };

    const message = `state=${state}, root=${await toString(null, root, ctx, true)}`; 
    await logger(options, ctx, message);

    const newBranch = await rDB.tables.branches.insert(ctx, null);
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
        unsolvedConstraints: await branch.data.unsolvedConstraints,
        unsolvedVariables: await branch.data.unsolvedVariables,
        unchecked: await branch.data.unchecked,
        checked: await branch.data.checked,
        setsInDomains: await branch.data.setsInDomains,
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
        unsolvedConstraints,
        setsInDomains,
        checked, fail, log
    } = await deepUnify(
        ctx,
        tuple, 
        definitionID
    );

    console.log("DEEP UNIFY - START DUMP UNSOLVED CONSTRAINTS!!");
    for await (let csID of unsolvedConstraints.values()) {
        console.log("DEEP UNIFY RR => ", await toString(null, csID, ctx)); 
    }

    await createBranch(
        options,
        fail,
        branch,
        varCounter,
        ctx.level,
        checked,
        unchecked,
        variables,
        constraints,
        unsolvedConstraints,
        unsolvedVariables,
        setsInDomains,
        log        
    );

    return branch;
}

module.exports = {unify, constants, createBranch};