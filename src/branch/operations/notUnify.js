const {
    type,
    // get,
    getVariable,
    // copyTerm
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
                cs.push({op: "!=", args: [p.id, q.id]});
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

            cs.push({op: "!=", args: [p.id, q.id]});
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

            cs.push({op: "!=", args: [p.id, q.id]});
            return false;
        },
    },
    t: {
        v: async (ctx, p, q, cs) => notUnifyFn.v.t(ctx, q, p, cs),
        t: async (ctx, p, q, cs) => {
            if (p.id !== q.id) {
                if (p.t.length === q.t.length) {
                    for (let i=0; i<p.t.length; i++) {
                        const [ok] = await doNotUnify(ctx, p.t[i], q.t[i], cs);

                        if (ok) {
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
    // p = await get(ctx, p);
    // q = await get(ctx, q);
    p = await getVariable(null, p, ctx);
    q = await getVariable(null, q, ctx);


    const ok = await notUnifyFn[type(p)][type(q)](ctx, p, q, cs);

    return [ok, cs];
    
    /*
    if (!ok) {
        if (cs.length > 0) {
            // we just need to set constrains on variables,
            if (cs.length === 1) {
                let {p, q} = cs[0];

                // p = await get(ctx, await copyTerm(ctx, p));
                // q = await get(ctx, await copyTerm(ctx, q));

                // p = await get(ctx, p);
                // q = await get(ctx, q);
                p = await getVariable(null, p, ctx);
                q = await getVariable(null, q, ctx);
            
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
                console.log("BUG: TODO: At Least one constrain!!");
                process.exit();
            }

            return true;
        }
    }
    // else if ok is true, don't need to do anything!!

    return ok;*/
}

module.exports = doNotUnify;