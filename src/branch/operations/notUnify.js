const {
    type,
    getVariable
} = require("./base");

/*
    1. v variable with constraints is going to unify with tuple.
    2. at least one constraints are set on variable tuple,
        2a. if this fails: there is no constraints and tuple unification didn't fail everithing fails,
    3. else, v variable unify with tuple with at least constraints or none.

    True - doesnt unify
    False - it may unify or not unify

    * Functions to set tuple at least one constraints
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

            cs.push({op: "!=", args: [p.id, q.id]});
            return false;            
        },
        c: async (ctx, p, q, cs) => {            
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
    p = await getVariable(null, p, ctx);
    q = await getVariable(null, q, ctx);


    const ok = await notUnifyFn[type(p)][type(q)](ctx, p, q, cs);

    return [ok, cs];
}

module.exports = doNotUnify;