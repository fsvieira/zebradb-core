const {
    varGenerator, 
    type,
    get,
    copyTerm,
    copyTerms,
    toString,
    prepareVariables,
    getVariable
} = require("./base");

/*
const {
    checkConstrains
} = require("./notUnify");
*/

/*const unifyVariable = async (ctx, p, q) => (await checkConstrains(ctx, p, q)) 
    && (await setVariable(ctx, await get(ctx, p), await get(ctx, q)));
*/

const checkCondition = async (ctx, c, domain) => {
    const [p, q] = await Promise.all(c.args.map(vID => getVariable(null, vID, ctx)));
    console.log({...p, e: null}, c.op, {...p, e: null});

    const ok = (c.op === '!=' && p.id !== q.id);
   
    if (ok && !(p.v || q.v)) {
        // if ok, and both p and q are not variables,
        // we can remove constrain,
        ctx.constrains = await ctx.constrains.remove(c.id);

        // There is no advantage to remove constrain variable from variables...
    }

    return ok;
}

const checkConditions = async (ctx, cs, domain) => {
    if (cs) {
        for await (let condID of cs.values()) {
            const c = await getVariable(null, condID, ctx);
            const ok = await checkCondition(ctx, c, domain);

            if (!ok) {
                return false;
            }
        }
    }
    
    return true;
}

const setVariable = async (ctx, v, p) => {
    if (v.id !== p.id) {
        if (v.d) {
            const dArray = await v.d.toArray();
            const d = await Promise.all(dArray.map(id => getVariable(null, id, ctx)));
            console.log(d);
        }
        if (v.d && (p.t || (p.c && !(await v.d.has(p.id))))) {
            /*
                if v has domain, then if value is:
                    * a tuple, it fails,
                    * if a constant not in domain, it fails. 
            */
            return false;
        }

        const c = !p.v || p.pv; 
        let a = c ? p : v;
        let b = c ? v : p;

        ctx.variables = await ctx.variables.set(b.id, {v: b.id, defer: a.id});

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

        if (!(await checkConditions(ctx, v.e, d))) {
            return false;
        }

        if (!(await checkConditions(ctx, p.e, d))) {
            return false;
        }

        if (d && (!a.d || a.d.id !== d)) {
            // update a
            ctx.variables = await ctx.variables.set(a.id, {...a, d});
        }
        /*
        if (p.e) {
            console.log("CHECK PE", p.e);
        }

        if (v.d) {
            console.log("CHECK VD", v.d);
        }

        if (p.d) {
            console.log("CHECK PD", p.d);
        }*/

        // TODO: set/check variable a, domains and constrains,
        // TODO: check constrains of v. 
    }

    return true;
}


const unifyFn = {
    v: {
        v: setVariable,
        t: setVariable, // !p.d && await unifyVariable(ctx, p, q),
        c: setVariable, // async (ctx, p, q) => (!p.d || (p.d && p.d.includes(q.id))) && await unifyVariable(ctx, p, q)
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


const __setVariable = async (ctx, v, p) => {
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
                // console.log("TODO: Exception Should use a ISet");
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
    options,
    tuple, 
    definition,
    level,
    variables=branch.table.db.iMap(),
    constrains=branch.table.db.iSet(),
    unsolvedVariables=branch.table.db.iSet(),
    unchecked=branch.table.db.iSet(),
    checked=branch.table.db.iSet(),
    log=branch.table.db.iArray()
) {
    const {varCounter, newVar} = varGenerator(await branch.data.variableCounter);
    const ctx = {
        variables,
        constrains,
        unsolvedVariables,
        unchecked,
        checked,
        definitionVariables: prepareVariables(definition),
        newVar,
        level,
        rDB: branch.table.db,
        branch,
        log,
        options  
    };

    const definitionID = await copyTerm(ctx, definition);

    /*ctx.unchecked = await ctx.unchecked.remove(definitionID);
    ctx.checked = await ctx.checked.add(definitionID);*/

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
        constrains: ctx.constrains,
        unsolvedVariables: unsolvedVariablesClean,
        unchecked: ctx.unchecked, 
        checked: ctx.checked, 
        fail: !ok, 
        variableCounter: varCounter(),
        log: ctx.log
    };
}
    
const doUnify = async (ctx, p, q) => {
    p = await get(ctx, p);
    q = await get(ctx, q);

    let s;
    
    if (ctx.options.log) {
        s = `${await toString(undefined, p, ctx)} ** ${await toString(undefined, q, ctx)}`;
    }

    const ok =  await unifyFn[type(p)][type(q)](ctx, p, q);

    if (ctx.options.log) {
        const ps = await toString(undefined, p, ctx);
        const qs = await toString(undefined, q, ctx);

        s += `; p=${ps}, q=${qs}`;
        if (!ok) {
            ctx.log = await ctx.log.push(`FAIL: ${s}`/*, JSON.stringify(p), " *** " , JSON.stringify(q)*/);
        }
        else {
            ctx.log = await ctx.log.push(`SUCC: ${s}`);
        }
    }
    // console.log("  ===> ", await toString(undefined, undefined, ctx), '\n');

    return ok;
}


async function unify (branch, options, tuple, definition) {

    const level = await branch.data.level + 1;
    const rDB = branch.table.db;

    const {
        variables, constrains, unsolvedVariables, unchecked, 
        checked, fail, variableCounter, log
    } = await deepUnify(
        branch,
        options,
        tuple, 
        definition,
        level,
        await branch.data.variables,
        await branch.data.constrains,
        await branch.data.unsolvedVariables,
        await branch.data.unchecked,
        await branch.data.checked, 
        await branch.data.log    
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
        constrains,
        unsolvedVariables,
        children: [],
        state,
        log
    }, null);

    const children = (await branch.data.children).concat([newBranch]);
    branch.update({children});

    return branch;
}

module.exports = {unify};