const {
    type: {
        CONSTANT, // : "c",
        TUPLE, // : "t",
        CONSTRAINT, // : "cs",
        SET, // : "s",
        LOCAL_VAR, // : 'lv',
        GLOBAL_VAR, // : 'gv',
        DEF_REF // d
    },
    operation: {
        OR,
        AND,
        IN
    }
} = require("./constants");


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
        if (v.type === GLOBAL_VAR) {
            vn = mapVars[cid] = cid;
        }
        else if (!vn) {
            vn = mapVars[cid] = ctx.newVar(v.c);
        }

        return vn;
    }

    for (let varname in p.variables) {
        const v = p.variables[varname];
        const vn = getVarname(v);

        if (v.type === TUPLE) {

            /*let body;
            if (v.body && v.body.length) {
                body = await v.body.map(getVarname);
            }*/

            ctx.variables = await ctx.variables.set(vn, {
                ...v,
                data: v.data.map(getVarname),
                // body,
                id: vn,
                domain: getVarname(p.variables[v.domain])
                // checked: v.checked
            });

            if (v.checked) {
                ctx.checked = await ctx.checked.add(vn);
            }
            else {
                ctx.unchecked = await ctx.unchecked.add(vn);
            }
        }
        else if (v.type === GLOBAL_VAR) {
            if (!(await ctx.variables.has(vn))) {
                ctx.variables = await ctx.variables.set(
                    vn, {
                        ...v,
                        pv: preserveVarname,
                        id: vn
                    }
                );
            }
        }
        else if (v.type === LOCAL_VAR) {
            /*const d = v.d?await array2iset(ctx, v.d):undefined;
            const e = v.e?await array2iset(ctx, v.e.map(getVarname)):undefined;
            const vin = v.in?await array2iset(ctx, v.in.map(getVarname)):undefined;
            */

            ctx.variables = await ctx.variables.set(
                vn, {
                    ...v,
                    pv: preserveVarname,
                    id: vn
                }
            );

            // ctx.variables = await ctx.variables.set(vn, {v: v.v, d, e, in: vin, pv: preserveVarname, id: vn});

            /*if ((e && d) || vin) {
                ctx.unsolvedVariables = await ctx.unsolvedVariables.add(vn);
            }*/
        }
        else if (v.type === CONSTANT) {
            ctx.variables = await ctx.variables.set(vn, {...v, id: vn});
        }
        else if (v.type === DEF_REF) {
            const id = v.data.id;
            const def = await v.data.data.definition;

            console.log(`TODO: 
                we need better handler of variables names!! 
                So that we can easly map variables to their global and local names,
                ex. Set must convert variables to their global name when aproprieted.
            `);

            const gvID = `__d_${id}`;

            // 1. we need to check if gvID is already set, if not we can create them,
            const hasVar = await hasVariable(null, gvID, ctx);
            
            if (!hasVar) {
                // if its not set yet, we need to set them,

                throw 'DEF REF COPY TERM!!' + id + ' ' + JSON.stringify(def)
                + " --> NEED TO MAKE THIS IF's function so that we can call them recursive!!";

            }
            // else do nothing.

        }
        else if (v.type === SET) {
            const variableID = v.variable;
            const vs = p.variables[variableID];

            if (vs.type === GLOBAL_VAR) {
                const hasVar = await hasVariable(null, variableID, ctx); 
                let gv = hasVar?await getVariable(null, variableID, ctx):null;

                if (!gv || gv.type === GLOBAL_VAR) {
                    console.log("We should also set Set variable did!!");

                    ctx.variables = await ctx.variables.set(vs.cid, {
                        ...v,
                        // body,
                        elements: v.elements.map(getVarname),
                        id: vs.cid,
                    });
                }
                // else nothing to do,
            }
            else {
                throw 'CREATE LOCAL SET???';
            }
        }
        /*
        else if (v.type === CONSTRAINT && v.op === IN) {
            const c = {op: v.op, x: getVarname(v.x), set: getVarname(v.set)};
            ctx.variables = await ctx.variables.set(vn, c)
        }
        else if (v.type === CONSTRAINT) {
            // its a constrain:
            const c = {op: v.op, args: v.args.map(getVarname).sort(), id: vn};
            ctx.variables = await ctx.variables.set(vn, c);
        }*/
        else {
            throw 'COPY TERTM CANT COPY ' + v.type;
        }
    }

    /*
    for (let i=0; i<p.constrains.length; i++) {
        ctx.constrains = await ctx.constrains.add(getVarname(p.constrains[i]));
    }*/

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

async function hasVariable (branch, id, ctx) {
    let v;
    const variables = ctx ? ctx.variables : await branch.data.variables;

    v = await variables.get(id);
    
    return !!v;
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
        const cv = await getVariable(branch, constrain.args[0], ctx);
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
    hasVariable,
    get,
    copyTerm,
    // copyTerms,
    toString,
    // prepareVariables
};