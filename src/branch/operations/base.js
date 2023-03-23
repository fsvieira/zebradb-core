/*
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
*/

async function array2iset (ctx, array) {
    let iset = ctx.rDB.iSet();
    for (let i=0; i<array.length; i++) {
        iset = await iset.add(array[i]);
    }

    return iset;
}

async function copyTerm(ctx, p, preserveVarname=false) {
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
            const d = v.d?await array2iset(ctx, v.d):undefined;
            const e = v.e?await array2iset(ctx, v.e.map(getVarname)):undefined;
 
            ctx.variables = await ctx.variables.set(vn, {v: v.v, d, e, pv: preserveVarname, id: vn});

            if (e && d) {
                ctx.unsolvedVariables = await ctx.unsolvedVariables.add(vn);
            }
        }
        else if (v.c) {
            ctx.variables = await ctx.variables.set(vn, {c: v.c, id: vn});
        }
        else if (v.op) {
            // its a constrain:
            const c = {op: v.op, args: v.args.map(getVarname).sort(), id: vn};
            ctx.variables = await ctx.variables.set(vn, c);
        }
    }

    for (let i=0; i<p.constrains.length; i++) {
        ctx.constrains = await ctx.constrains.add(getVarname(p.constrains[i]));
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

async function toStringConstrains (branch, v, cID, ctx) {
    const constrain = await getVariable(branch, cID, ctx);

    if (constrain.op === '!=') {
        const cv = await getVariable(branch, constrain.args[0]);
        const rv = v.id === cv.id ? constrain.args[1] : constrain.args[0];

        return await toString(branch, rv, ctx, false);
    }
    else if (constrain.op === 'OR') {
        const r = [];
        for await (let e of constrain.args.values()) {
            r.push(await toStringConstrains(branch, v, e, ctx));
        }

        return r.join(" OR ");
    }
}

async function toString (branch, id, ctx, constrains=true) {
    branch = branch || ctx?.branch;
    id = id || await branch.data.root;    

    const d = !!ctx; 
    const v = await getVariable(branch, id, ctx);
    
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
        const domainArray = v.d ? (await v.d.toArray()).sort(): undefined;
        const domain = domainArray ? (await Promise.all(domainArray.map(id => toString(branch, id, ctx)))).filter(v => v !== ''):undefined;
        const ds = domain && domain.length?`:{${domain.join(" ")}}`:"";

        console.log("TODO: remove constrains duplicates on final fase.");
        let e = "";
        if (constrains) { 
            const es = v.e ? 
                (await Promise.all(
                    (await v.e.toArray())
                    .map(cID => toStringConstrains(branch, v, cID, ctx)))).filter(v => v !== '')
                : undefined;
            // const es = v.e ? (await Promise.all(v.e.map(id => toString(branch, id, ctx, stop)))).filter(v => v !== ''):undefined;
            e = es && es.length?`~{${[...new Set(es)].join(" ")}}`:"";
        }

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
    // copyTerms,
    toString,
    // prepareVariables
};