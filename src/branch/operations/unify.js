const {
    varGenerator, 
    type,
    get,
    copyTerm,
    copyTerms,
    toString,
    prepareVariables
} = require("./base");

const {
    checkConstrains
} = require("./notUnify");

const unifyVariable = async (ctx, p, q) => (await checkConstrains(ctx, p, q)) 
    && (await setVariable(ctx, await get(ctx, p), await get(ctx, q)));

const unifyFn = {
    v: {
        v: unifyVariable,
        t: async (ctx, p, q) => !p.d && await unifyVariable(ctx, p, q),
        c: async (ctx, p, q) => (!p.d || (p.d && p.d.includes(q.id))) && await unifyVariable(ctx, p, q)
    },
    t: {
        v: async (ctx, p, q) => unifyFn.v.t(ctx, q, p),
        t: async (ctx, p, q) => {
            if (p.id !== q.id) {
                if (p.t.length === q.t.length) {
                    for (let i=0; i<p.t.length; i++) {
                        const r = await doUnify(ctx, p.t[i], q.t[i]);

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
        c: async () => false
    },
    c: {
        v: async (ctx, p, q) => unifyFn.v.c(ctx, q, p),
        t: async () => false,
        c: async (ctx, p, q) => p.c === q.c
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



const setVariable = async (ctx, v, p) => {
    if (v.id !== p.id) {
        if (p.v) {
            let a=v, b=p;

            if (p.pv) {
                a = p;
                b = v;
            }

            let e;
            let d;

            if (a.e && b.e) {
                console.log("TODO: Exception Should use a ISet");
                e = [...new Set((a.e || []).concat(b.e || []))].sort();
            }
            else {
                e = a.e || b.e;
            }


            if (a.d && b.d) {
                // intersect both domains,
                d = a.d.filter(c => b.d.includes(c));

                if (d.length === 0) {
                    return false;
                }
            }
            else {
                d = a.d || b.d;
            }

            if (e && d) {
                const es = [];
                for (let i=0; i<e.length; i++) {
                    const v = await get(ctx, e[i]);
                    if (v.c) {
                        const index = d.findIndex(c => c === v.id);
                        if (index !== -1) {
                            d.splice(index, 1);

                            if (d.length === 0) {
                                return false;
                            }
                        }
                    }
                    else if (v.v) {
                        es.push(v.id);
                    }
                }

                e = es.length ? es : undefined;
            }

            if (d && d.length === 1) {
                ctx.variables = await ctx.variables.set(a.id, {
                    ...a,
                    defer: d[0]
                });

                ctx.variables = await ctx.variables.set(b.id, {
                    ...b,
                    defer: d[0]
                });
            }
            else {
                if (e || d) {
                    ctx.variables = await ctx.variables.set(a.id, {
                        ...a,
                        e,
                        d
                    });

                    if (e && d) {
                        ctx.unsolvedVariables = await ctx.unsolvedVariables.remove(b.id);
                        ctx.unsolvedVariables = await ctx.unsolvedVariables.add(a.id);
                    }
                }

                ctx.variables = await ctx.variables.set(b.id, {
                    ...v,
                    defer: a.id
                });
            }
        }
        else {
            ctx.variables = await ctx.variables.set(v.id, {
                ...v,
                defer: p.id
            });
        }
    }

    return true;
}

async function deepUnify(
    branch,
    tuple, 
    definition,
    level,
    variables=branch.table.db.iMap(),
    unsolvedVariables=branch.table.db.iSet(),
    unchecked=branch.table.db.iSet(),
    checked=branch.table.db.iSet()
) {
    const {varCounter, newVar} = varGenerator(await branch.data.variableCounter);
    const ctx = {
        variables,
        unsolvedVariables,
        unchecked,
        checked,
        definitionVariables: prepareVariables(definition),
        newVar,
        level,
        rDB: branch.table.db,
        branch        
    };

    const definitionID = await copyTerm(ctx, definition);

    ctx.unchecked = await ctx.unchecked.remove(definitionID);
    ctx.checked = await ctx.checked.add(definitionID);

    const ok = await doUnify(
        ctx,
        tuple, 
        definitionID
    );

    let unsolvedVariablesClean = ctx.unsolvedVariables;
    if (await ctx.unchecked.size === 0 && ctx.unsolvedVariables.size > 0) {
        // Check if unsolved variables are solved.
        for await (let vid of ctx.unsolvedVariables.values()) {
            const v = await get(ctx, vid);

            if (!(v.e && v.d)) {
                unsolvedVariablesClean = await unsolvedVariablesClean.remove(vid);
            }
        }
    }

    return {
        variables: ctx.variables, 
        unsolvedVariables: unsolvedVariablesClean,
        unchecked: ctx.unchecked, 
        checked: ctx.checked, 
        fail: !ok, 
        variableCounter: varCounter()
    };
}
    
const doUnify = async (ctx, p, q) => {
    p = await get(ctx, p);
    q = await get(ctx, q);

    let s = `${await toString(undefined, p, ctx)} ** ${await toString(undefined, q, ctx)}`;

    const ok =  await unifyFn[type(p)][type(q)](ctx, p, q);

    const ps = await toString(undefined, p, ctx);
    const qs = await toString(undefined, q, ctx);

    s += `; p=${ps}, q=${qs}`;
    if (!ok) {
        console.log("FAIL : ", s, JSON.stringify(p), " *** " , JSON.stringify(q));
    }
    else {
    //    console.log("SUCC : ", s);
    }

    // console.log("  ===> ", await toString(undefined, undefined, ctx), '\n');

    return ok;
}


async function unify (branch, tuple, definition) {

    const level = await branch.data.level + 1;
    const rDB = branch.table.db;

    const {
        variables, unsolvedVariables, unchecked, 
        checked, fail, variableCounter
    } = await deepUnify(
        branch,
        tuple, 
        definition,
        level,
        await branch.data.variables,
        await branch.data.unsolvedVariables,
        await branch.data.unchecked,
        await branch.data.checked    
    );

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

    // const state = fail?'no':await unchecked.size === 0?'yes':'maybe';

    const newBranch = await rDB.tables.branches.insert({
        parent: branch,
        root: await branch.data.root,
        variableCounter,
        level,
        checked,
        unchecked,
        variables,
        unsolvedVariables,
        children: [],
        state
    }, null);

    const children = (await branch.data.children).concat([newBranch]);
    branch.update({children});

    return branch;
}

module.exports = {unify};