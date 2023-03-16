const prepareVariables = (p, vars={}) => {
    if (p.t) {
        if (p.body) {
            for (let i=0; i<p.body.length; i++) {
                prepareVariables(p.body[i], vars);
            }    
        }

        for (let i=0; i<p.t.length; i++) {
            prepareVariables(p.t[i], vars);
        }
    }
    else if (p.v) {
        let x = vars[p.v];
        let e;

        if (x) {
            if (p.e && x.e) {
                const dups = x.e.reduce((acc, v) => {
                    if (v.v) {
                        acc[v.v] = true;
                    }

                    return acc;
                }, {});

                e = p.e.filter(v => !dups[v.v]).map(e => e.v?{...e, e:undefined}:e);

                x.e = x.e.concat(e);
            }
            else if (p.e) {
                x.e = p.e.map(e => e.v?{...e, e:undefined}:e);
            }
        }
        else {
            x = {...p, e: p.e?p.e.map(e => e.v?{...e, e:undefined}:e):undefined};
        }

        vars[x.v] = x;

        e = e || p.e || [];
        for (let i=0; i<e.length; i++) {
            const a = e[i];
            prepareVariables(a.v?{...a, e: [{...p, e: undefined}]}:a, vars);
        }
    }

    return vars;
}

const copyTerms = async (ctx, t, preserveVarname=0, varIds={}) => {
    const ts = [];
    for (let i=0; i<t.length; i++) {
        const v = await get(ctx, t[i]);

        ts.push(await copyTerm(ctx, v, preserveVarname, varIds));
    }

    return ts;
}

/*const copyTerm = async (ctx, p, preserveVarname=0, varIds={}) => {
    console.log(JSON.stringify(p));
    let id = typeof p === 'string' ? p : p.id;

    if (!id) {
        if (p.c) {
            // register constant
            id = ctx.newVar(p.c);
            ctx.variables = await ctx.variables.set(id, {...p, id});
        }
        else if (p.v) {
            id = varIds[p.v];

            if (!id) {
                // create new variable and map it to definition variable.
                id = ctx.newVar();
                varIds[p.v] = id;
                const e = p.e ? await copyTerms(ctx, p.e, preserveVarname, varIds):undefined;
                const d = p.d ? await copyTerms(ctx, p.d, preserveVarname, varIds):undefined;
                const v = {v: p.v, id, e, d, pv: preserveVarname};
                ctx.variables = await ctx.variables.set(id, v);
                // ctx.definitionVariables[p.v] = v;
                // delete varIds[p.v];

                if (e && d) {
                    ctx.unsolvedVariables = await ctx.unsolvedVariables.add(id);
                }
            }
        }
        else if (p.t) {

            if (p.body) {
                const bodySet = await ctx.variables.get("_body") || ctx.rDB.iSet();
                
                for (let i=0; i<p.body.length; i++) {
                    const id = await copyTerm(ctx, p.body[i], preserveVarname, varIds);
                    ctx.unchecked = await ctx.unchecked.add(id);
                    bodySet.add(id);
                }
                
                ctx.variables.set("_body", id);
            }
            
            let t = [];
            for (let i=0; i<p.t.length; i++) {
                const q = await get(ctx, p.t[i]);
                t.push(await copyTerm(ctx, q, preserveVarname, varIds));
            }

            id = ctx.newVar();
            ctx.variables = await ctx.variables.set(id, {t, id});    
            ctx.unchecked = await ctx.unchecked.add(id);
        }
    }

    return id;
}*/

async function copyTerm(ctx, p) {
    const mapVars = {};

    const getVarname = v => {
        let cid = v.cid || v;
        let vn = mapVars[cid];
        if (!vn) {
            vn = mapVars[cid] = ctx.newVar(v.c);
        }

        return vn;
    }


    for (let varname in p.variables) {
        const v = p.variables[varname];
        const vn = getVarname(v);

        if (v.t) {

            let body;
            if (v.body && v.body.length) {
                body = v.body.map(getVariable);
            }

            ctx.variables = await ctx.variables.set(vn, {
                t: v.t.map(getVarname), 
                body,
                id: vn
                // checked: v.checked
            });

            if (v.checked) {
                ctx.checked = await ctx.checked.add(vn);
            }
            else {
                ctx.unchecked = await ctx.unchecked.add(vn);
            }
        }
        else if (v.v) {
            let d = v.d?v.d.map(getVarname):undefined;

            console.log("v.e is a Set, this should go to constrains and save on constrains ? ")
            let e = v.e?v.e.map(getVarname):undefined;
 
            ctx.variables = await ctx.variables.set(vn, {v: v.v, d, e, id: vn});
        }
        else if (v.c) {
            ctx.variables = await ctx.variables.set(vn, {c: v.c, id: vn});
        }
    }

    return mapVars[p.root];
}

function varGenerator (counter) {
    return {
        varCounter: () => counter,
        newVar: v => {
            const varname = 'v$' + (v?`c#${v}`:++counter);
            return varname;
        }
    }
}

async function getVariable (branch, id, ctx) {
    let v;
    const variables = ctx ? ctx.variables : await branch.data.variables;

    do {
        v = await variables.get(id);
        if (id && id === v.defer) {
            console.log("BUG: id can't defer to itself!", id, v);
            process.exit();
        }
        id = v.defer;
    }
    while(id);

    return v;
}

const type = v => v.t ? "t" : v.c?"c": v.v ? "v" : "";

const get = async (ctx, v) => {
    if (typeof v === 'string' || v.id) {
        v = await getVariable(null, v.id || v, ctx);
    }
    else if (v.v !== undefined) {
        v = ctx.definitionVariables[v.v] || v;

        if (v.id) {
            v = ctx.definitionVariables[v.v] = await getVariable(null, v.id, ctx);
        }
    }

    return v;
}

async function toString (branch, id, ctx, stop={}) {
    branch = branch || ctx?.branch;
    id = id || await branch.data.root;    

    const d = !!ctx; 
    const v = await (ctx ? get(ctx, id) : getVariable(branch, id, ctx));

    if (stop[v.id]) {
        return "";
    }

    stop[v.id] = true;
    
    if (v.t) {
        const ts = [];
        for (let i=0; i<v.t.length; i++) {
            const a = v.t[i];
            ts.push(await toString(branch, a, ctx));
        }

        const checked = await (ctx?.checked || (await branch.data.checked)).has(v.id);
        return (checked?'@' :"")
            + `${d ? v.id || "" : ""}(${ts.join(" ")})`;
    }
    else if (v.v) {
        const domain = v.d ? (await Promise.all(v.d.map(id => toString(branch, id, ctx, stop)))).filter(v => v !== ''):undefined;
        const ds = domain && domain.length?`:{${domain.join(" ")}}`:"";

        const es = v.e ? (await Promise.all(v.e.map(id => toString(branch, id, ctx, stop)))).filter(v => v !== ''):undefined;
        const e = es && es.length?`~{${es.join(", ")}}`:"";
        
        return "'" + (!v.pv && v.id?v.id + "::": "") + v.v + ds + e;
    }
    else if (v.c) {
        return v.c;
    }
}

module.exports = {
    varGenerator, 
    type,
    getVariable,
    get,
    copyTerm,
    copyTerms,
    toString,
    prepareVariables
};