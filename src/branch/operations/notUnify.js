const {
    type,
    get,
    copyTerm
} = require("./base");

/*
    1. v variable with constrains is going to unify with tuple.
    2. at least one constrains are set on variable tuple,
        2a. if this fails: there is no constrains and tuple unification didn't fail everithing fails,
    3. else, v variable unify with tuple with at least constrains or none.
*/
/*
    True - doesnt unify
    False - it may unify or not unify

    * Functions to set tuple at least one constrains
*/
const notUnifyFn = {
    v: {
        v: async (ctx, p, q, cs) => {
            if (
                ((p.id || q.id) && p.id !== q.id)
                || (!(p.id && q.id) && p.v !== q.v)
            ) {
                cs.push({p, q});
            }
            
            return false;            
        },
        t: async (ctx, p, q, cs) => {
            if (p.d) {
                return true;    
            }

            console.log(
                "TODO: Not Unify; Check if there is alredy set constrains that don't allow unify, if yes we can return true.",
                JSON.stringify(p), JSON.stringify(q)
            );

            cs.push({p, q});
            return false;            
        },
        c: async (ctx, p, q, cs) => {            
            if (p.e) {
                console.log(
                    "TODO: Not Unify; Check if there is alredy set constrains that don't allow unify, if yes we can return true.",
                    JSON.stringify(p), JSON.stringify(q)
                );

                process.exit();
            }

            cs.push({p, q});
            return false;
        },
    },
    t: {
        v: async (ctx, p, q, cs) => notUnifyFn.v.t(ctx, q, p, cs),
        t: async (ctx, p, q, cs) => {
            if (p.id !== q.id) {
                if (p.t.length === q.t.length) {
                    for (let i=0; i<p.t.length; i++) {
                        const r = await doNotUnify(ctx, p.t[i], q.t[i], cs);

                        if (r) {
                            return true;
                        }
                    }
                    
                    return false;
                }
                
                return true;
            }

            return false;
        },
        c: async () => true
    },
    c: {
        v: async (ctx, p, q, cs) => notUnifyFn.v.c(ctx, q, p, cs),
        t: async () => true,
        c: async (ctx, p, q, cs) => p.c !== q.c
    }
}

const doNotUnify = async (ctx, p, q, cs = []) => {
    p = await get(ctx, p);
    q = await get(ctx, q);

    const ok =  await notUnifyFn[type(p)][type(q)](ctx, p, q, cs);

    if (!ok) {
        if (cs.length > 0) {
            // we just need to set constrains on variables,
            if (cs.length === 1) {
                let {p, q} = cs[0];

                // p = await get(ctx, await copyTerm(ctx, p));
                // q = await get(ctx, await copyTerm(ctx, q));

                p = await get(ctx, p);
                q = await get(ctx, q);

                if (p.v) {
                    let e = (p.e || []).concat(q.id);

                    ctx.variables = await ctx.variables.set(p.id, {
                        ...p,
                        e
                    });

                    if (p.d) {
                        ctx.unsolvedVariables = await ctx.unsolvedVariables.add(p.id);
                    }
                }

                if (q.v) {
                    const e = (q.e || []).concat(p.id);

                    ctx.variables = await ctx.variables.set(q.id, {
                        ...q,
                        e
                    });

                    if (q.d) {
                        ctx.unsolvedVariables = await ctx.unsolvedVariables.add(q.id);
                    }

                }
            }
            else {
                console.log("TODO: At Least one constrain!!");
                process.exit();
            }

            return true;
        }
    }
    // else if ok is true, don't need to do anything!!

    return ok;
}

const checkConstrainsList = async (ctx, list, p) => {
    if (list && list.length) {
        for (let i=0; i<list.length; i++) {
            const x = await get(ctx, list[i]);

            if (
                (x.v && p.v && x.id === p.id && x.v === p.v)
                || (x.c && p.c && x.c === p.c)
                || (x.t && p.t && x.id === p.id)
            ) {
                return false;
            }
            else if (x.t && p.t) {
                return await doNotUnify(ctx, x, p);
            }
        }
    }

    return true;
}

const checkConstrains = async (ctx, p, q) => await checkConstrainsList(ctx, p.e, q) && await checkConstrainsList(ctx, q.e, p);


module.exports = {checkConstrains};