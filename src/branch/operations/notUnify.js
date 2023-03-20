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

            /*console.log(
                "TODO: Not Unify; Check if there is alredy set constrains that don't allow unify, if yes we can return true.",
                JSON.stringify(p), JSON.stringify(q)
            );*/

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
                console.log("BUG: TODO: At Least one constrain!!");
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

// const checkConstrains = async (ctx, p, q) => await checkConstrainsList(ctx, p.e, q) && await checkConstrainsList(ctx, q.e, p);

const testValue = async (ctx, constrains, value) => {
    const e = constrains.e;

    for await (let cID of e.values()) {
        const c = await get(ctx, cID);

        const updatedConstrains = await Promise.all(c.args.map(v => get(ctx, v)));

        if (c.op === '!=') {
            const cmp = constrains.id === updatedConstrains[0].id ? updatedConstrains[1] : updatedConstrains[0];
            
            if (cmp.id === value.id) {
                return false;
            }
            else if (cmp.t && value.t) {
                console.log("TODO: testValue two tuples!!");
            }
        }
    }

    return true;

}

const checkConstrains = async (ctx, p, q) => {
    console.log("TODO: checkConstrains", p, q);

    if (p.v && q.v) { 
        if (p.e && q.e) {
            // const e = p.e.filter(v => q.e.includes(v));

            let e = ctx.rDB.iSet();
            for await (let varname of p.e.values()) {
                if (await q.e.has(varname)) {
                    e = await e.add(varname);
                }
            }

            if (e.size) {
                /*
                for (let i=0; i<e.length; i++) {
                    console.log(e);
                    process.exit();
                }*/
                /**
                 * we can't do insta fail, because there can be or constrains.
                 * 
                 */

                for await (let varname of e.values()) {
                    console.log("VARNME ", varname);
                }

                console.log("TODO: test checkConstrains 1: ");
            }
        }
    }
    else if (p.e) {
        return await testValue(ctx, p, q);
    }
    else if (q.e) {
        return await testValue(ctx, q, p);
    }

    return true;

    /*
        We just need to check constrains that intersect, 
        when variables unify they also unfies their constrains, so consider the 
        case:
            'x \ 'y => xc constrain is at 'x and 'y 
            'z = 'y => now constrain xc is also on 'z

            'x = 'z , the constrain of xc intersects, and therefor needs to be tested.

    */
    /*if (p.e || q.e) {
        const r = new Set([...(p.e || []), ...(q.e || [])]);

        for (let s in r) {
            console.log(s);
        }
    }*/
}


module.exports = {checkConstrains};