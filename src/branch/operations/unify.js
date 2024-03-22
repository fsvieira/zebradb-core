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

    if (await p.uniqueMap.size) {
        throw 'P INDEXES';
    }

    if (await q.uniqueMap.size) {
        throw 'Q INDEXES';
    }

    console.log("TODO: should calc the set size ??");
    /*let aSetSize = await ctx.getSetSize(a.id);
    let bSetSize = await ctx.getSetSize(b.id);

    aSetSize = aSetSize === -1 ? bSetSize : aSetSize;  
    bSetSize = bSetSize === -1 ? aSetSize : bSetSize;

    if (aSetSize !== bSetSize) {
        // we can't unify diferent sets,
        return false;
    }*/

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
                const eID = await copyPartialTerm(
                    ctx, definition, copyID, 
                    true, true,
                    {[defID]: a.id}
                );

                const ok = await doUnify(ctx, id, eID);

                if (!ok) {
                    return false;
                }
            }

            a = await ctx.getVariable(a.id);

            await ctx.setVariableValue(a.id, {
                ...a,
                defID,
                definition,
                // size: aSetSize
            });

            /*if (aSize === aSetSize) {
                await ctx.removeExtendSet(a.id);
            }
            else { 
                await ctx.addExtendSet(a.id);
            }*/

            await ctx.addExtendSet(a.id);
        }
        else {
            throw 'UnifyMsMs : TODO handle sets with more than one element def!';
        }

        await ctx.setVariableValue(b.id, {
            ...b,
            defer: a.id
        });

        await ctx.removeExtendSet(b.id);

    }

    return true;
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

                    // await checkTuple(ctx, p, q);

                    await ctx.setVariableValue(
                        q.id, {
                            defer: p.id
                        }
                    );

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
    /*
    if (await ctx.checked.has(p.id)) {
        ctx.variables = await ctx.variables.set(q.id, {...q, defer: p.id});
        ctx.unchecked = await ctx.unchecked.remove(q.id);
    }
    else if (await ctx.checked.has(q.id)) {
        ctx.variables = await ctx.variables.set(p.id, {...p, defer: q.id});
        ctx.unchecked = await ctx.unchecked.remove(p.id);
    }*/

    // TODO: this function and checked unchecked will probably stop being needed
    if (await ctx.hasChecked(p.id)) {
        await ctx.setVariableValue(q.id, {...q, defer: p.id});
        // ctx.unchecked = await ctx.unchecked.remove(q.id);
        await ctx.removeUnchecked(q.id);
    }
    else if (await ctx.hasChecked(q.id)) {
        await ctx.setVariableValue(p.id, {...p, defer: q.id});
        // ctx.variables = await ctx.variables.set(p.id, {...p, defer: q.id});
        // ctx.unchecked = await ctx.unchecked.remove(p.id);
        await ctx.removeUnchecked(p.id);
    }
}

const doUnify = async (ctx, p, q) => {
    p = await ctx.getVariable(p);
    q = await ctx.getVariable(q);

    let s;
    
    if (ctx.options.log) {
        s = `${await ctx.toString(p.id)} ** ${await ctx.toString(q.id)}`;
    }

    /*
    console.log(
        'DO UNIFY ',
        await toString(null, p.id, ctx), ' ** ', 
        await toString(null, q.id, ctx)
    );*/

    const ok =  await unifyFn[p.type][q.type](ctx, p, q);

    if (ctx.options.log) {
        const ps = await ctx.toString(p.id);
        const qs = await ctx.toString(q.id);

        s += `; p=${ps}, q=${qs}`;
        if (!ok) {
            await ctx.logger(`FAIL: ${s}`);
        }
        else {
            await ctx.logger(`SUCC: ${s}`);
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
    extendSets,
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
            extendSets,
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
        extendSets,
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

async function unify (ctx, tuple, definitionID, definition) {
    if (definition) {
        throw 'unify definition provided, deprecated!!'
        definitionID = await copyTerm(ctx, definition);
    }

    const ok = await doUnify(
        ctx,
        tuple, 
        definitionID
    );

    ctx.state = !ok ? 'no': ctx.state;
}

module.exports = {unify, constants, createBranch};