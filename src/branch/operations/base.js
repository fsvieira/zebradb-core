const {
    type: {
        CONSTANT, // : "c",
        TUPLE, // : "t",
        CONSTRAINT, // : "cs",
        SET, // : "s",
        SET_EXP, // 'se',
        SET_CS, // 'cs',
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

async function save2db (
    ctx, p, preserveVarname, 
    getVarname,
    v, vn,
    definitionsDB
) {
    if (v.type === TUPLE) {

        /*let body;
        if (v.body && v.body.length) {
            body = await v.body.map(getVarname);
        }*/

        ctx.variables = await ctx.variables.set(vn, {
            ...v,
            data: v.data.map(v => getVarname(p.variables[v])),
            // body,
            id: vn,
            domain: v.domain ? getVarname(p.variables[v.domain]) : undefined
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
        const gv = await ctx.variables.get(vn);

        if (v.definition) {
            throw 'copy term v has definition!!';
        }

        if (!gv) {
            const definition = await definitionsDB.getDefByVariable(v);

            console.log("copyterm global var: we need a new scope ??");

            ctx.variables = await ctx.variables.set(
                vn, {
                    ...v,
                    pv: preserveVarname,
                    id: vn
                }
            );

            await copyTerm(ctx, definition, definitionsDB, true);
        }
        /*
        if (v.definition && (!gv || (gv.type === GLOBAL_VAR))) {
            definitionsDB.getDefByVariable(v)
            // await copyTerm(ctx, v.definition, true);
        }
        else if (!gv) {
            ctx.variables = await ctx.variables.set(
                vn, {
                    ...v,
                    pv: preserveVarname,
                    id: vn
                }
            );
        }*/
    }
    else if (v.type === LOCAL_VAR) {
        /*const d = v.d?await array2iset(ctx, v.d):undefined;
        const e = v.e?await array2iset(ctx, v.e.map(getVarname)):undefined;
        const vin = v.in?await array2iset(ctx, v.in.map(getVarname)):undefined;
        */
        let constraints;
        if (v.constraints) {
            constraints = ctx.rDB.iSet();

            for (let i=0; i<v.constraints.length; i++) {
                const vc = v.constraints[i];
                const id = getVarname(p.variables[vc]);
                constraints = await constraints.add(id);
            }
        }

        ctx.variables = await ctx.variables.set(
            vn, {
                ...v,
                pv: preserveVarname,
                domain: v.domain ? getVarname(p.variables[v.domain]) : undefined,
                constraints,
                id: vn
            }
        );

        if (v.constraints && v.domain) {
            ctx.unsolvedVariables = await ctx.unsolvedVariables.add(vn);
        }

        // ctx.variables = await ctx.variables.set(vn, {v: v.v, d, e, in: vin, pv: preserveVarname, id: vn});

        /*if ((e && d) || vin) {
            ctx.unsolvedVariables = await ctx.unsolvedVariables.add(vn);
        }*/
    }
    else if (v.type === CONSTANT) {
        ctx.variables = await ctx.variables.set(vn, {...v, id: vn});
    }
    else if (v.type === DEF_REF) {
        const def = await v.data.data.definition;

        // const gvID = `__d_${id}`;

        // 1. we need to check if gvID is already set, if not we can create them,
        const hasVar = await hasVariable(null, vn, ctx);
        
        if (!hasVar) {
            // if its not set yet, we need to set them,

            /*await save2db(
                ctx, def, preserveVarname,
                getVarname,
                def.variables[def.root], vn            
            );*/
            const id = await copyTerm(ctx, def, definitionsDB, preserveVarname);

            ctx.variables = await ctx.variables.set(
                vn, {
                    type: GLOBAL_VAR,
                    id: vn,
                    defer: id
                }
            );            
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
                    elements: v.elements.map(e => getVarname(p.variables[e])),
                    id: vs.cid,
                });
            }
            // else nothing to do,
        }
        else {
            throw 'CREATE LOCAL SET???';
        }
    }
    else if (v.type === SET_EXP) {
        const variableID = v.variable;
        const vs = p.variables[variableID];

        if (vs.type === GLOBAL_VAR) {
            const hasVar = await hasVariable(null, variableID, ctx); 
            let gv = hasVar?await getVariable(null, variableID, ctx):null;

            if (!gv || gv.type === GLOBAL_VAR) {
                console.log("We should also set Set variable did!!");

                ctx.variables = await ctx.variables.set(vs.cid, {
                    ...v,
                    a: getVarname(p.variables[v.a]),
                    b: getVarname(p.variables[v.b]),
                    id: vs.cid,
                });
            }
            // else nothing to do,
        }
        else {
            throw 'CREATE LOCAL EXP SET???';
        }
    }
    else if (v.type === SET_CS) {
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
                    // element: getVarname(p.variables[v.element]),
                    id: vs.cid,
                });
            }
            // else nothing to do,
        }
        else {
            throw 'CREATE LOCAL EXP SET???';
        }
    }
    else if (v.type === CONSTRAINT) {
        console.log(JSON.stringify(v, null, '  '), p.variables[v.a], p.variables[v.b]);
        const a = getVarname(p.variables[v.a]);
        const b = getVarname(p.variables[v.b]);

        let constraints;
        if (v.constraints) {
            constraints = ctx.rDB.iSet();

            for (let i=0; i<v.constraints.length; i++) {
                const vc = v.constraints[i];
                const id = getVarname(p.variables[vc]);
                constraints = await constraints.add(id);
            }
        }

        ctx.variables = await ctx.variables.set(vn, {
            ...v,
            a, b,
            constraints,
            id: vn
        });

    }

    /*
    else if (v.type === CONSTRAINT && v.op === IN) {
        const c = {op: v.op, x: getVarname(v.x), set: getVarname(v.set)};
        ctx.variables = await ctx.variables.set(vn, c)
    }
    else if (v.type === CONSTRAINT) {
        // its a constraint:
        const c = {op: v.op, args: v.args.map(getVarname).sort(), id: vn};
        ctx.variables = await ctx.variables.set(vn, c);
    }*/
    else {
        throw 'COPY TERM CANT COPY ' + v.type;
    }
}

async function copySetConstrains (
    ctx, p, preserveVarname, 
    getVarname, 
    v, vn,
    definitionsDB
) {
    console.log(p, v, vn);
    const variableID = v.variable;
    const vs = p.variables[variableID];

    if (vs.type === GLOBAL_VAR) {
        const hasVar = await hasVariable(null, variableID, ctx); 
        let gv = hasVar?await getVariable(null, variableID, ctx):null;

        if (!gv || gv.type === GLOBAL_VAR) {
            console.log("We should also set Set variable did!!");

            let element = p.variables[v.element];

            if (element.type === DEF_REF) {
                element = await element.data.data.definition;
            }
    
            ctx.variables = await ctx.variables.set(vs.cid, {
                ...v,
                element,
                id: vs.cid,
            });

            // Check if element has globals variables,
            for (let varname in element.variables) {
                const v = element.variables[varname];
                if (v.type === GLOBAL_VAR) {
                    const vn = getVarname(v);
                    
                    await save2db(
                        ctx, p, preserveVarname, 
                        getVarname, 
                        v, vn,
                        definitionsDB
                    );
                }
            }
            
        }

    }
    else {
        throw 'CREATE LOCAL EXP SET???';
    }
}

async function copyTerm(ctx, p, definitionsDB, preserveVarname=false) {
    const mapVars = {};

    const getVarname = v => {
        const cid = v.cid || v;
        let vn = mapVars[cid];

        if (!vn) {
            if (v.type === DEF_REF) {
                const id = v.data.id;
                vn = `__d_${id}`;
                mapVars[cid] = vn;
            }
            else if (v.type === GLOBAL_VAR) {
                vn = mapVars[cid] = cid;
            }
            else if (v.type === CONSTANT) {
                vn = mapVars[cid] = ctx.newVar(v.data);
            }
            else {
                vn = mapVars[cid] = ctx.newVar();
            }
        }
        /*
        let cid = v.cid || v;
        let vn = mapVars[cid];
        if (v.type === GLOBAL_VAR) {
            vn = mapVars[cid] = cid;
        }
        else if (!vn) {
            vn = mapVars[cid] = ctx.newVar(v.c);
        }*/

        return vn;
    }

    const {root, variables} = p;
    const v = variables[root];

    if (v.type === SET_CS) {
        const vn = getVarname(v);
        await copySetConstrains(
            ctx, p, preserveVarname, 
            getVarname, 
            v, vn,
            definitionsDB
        );
    }
    else {
        for (let varname in p.variables) {
            const v = p.variables[varname];
            const vn = getVarname(v);

            await save2db(
                ctx, p, preserveVarname, 
                getVarname, 
                v, vn,
                definitionsDB
            );
        }
    }
    /*
    for (let i=0; i<p.constraints.length; i++) {
        ctx.constraints = await ctx.constraints.add(getVarname(p.constraints[i]));
    }*/

    return mapVars[p.root];
}

function getConstantVarname (constant) {
    return `c#${constant}`;
}

function varGenerator (counter) {
    return {
        varCounter: () => counter,
        newVar: v => {
            const varname = 'v$' + (v?getConstantVarname(v):++counter);
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
        
        console.log(id, v);
        if (id && id === v.defer) {
            throw "BUG: id can't defer to itself! " +  id + ' ' + JSON.stringify(v, null, '  ');
        }

        id = v.defer;
    }
    while(id);

    return v;
}

// const type = v => v.t ? "t" : v.c?"c": v.v ? "v" : "";

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

async function toStringConstraints (branch, v, cID, ctx) {
    const constraint = await getVariable(branch, cID, ctx);

    if (constraint.op === '!=') {
        const cv = await getVariable(branch, constraint.args[0], ctx);
        const rv = v.id === cv.id ? constraint.args[1] : constraint.args[0];

        return await toString(branch, rv, ctx, false);
    }
    else if (constraint.op === 'OR') {
        const r = [];
        for await (let e of constraint.args.values()) {
            r.push(await toStringConstraints(branch, v, e, ctx));
        }

        return r.join(" OR ");
    }
}

async function toString (branch, id, ctx, constraints=true) {
    branch = branch || ctx?.branch;
    id = id || await branch.data.root;    

    const d = !!ctx; 
    const v = await getVariable(branch, id, ctx);
    
    switch (v.type) {
        case TUPLE: {
            const ts = [];
            for (let i=0; i<v.data.length; i++) {
                const a = v.data[i];
                ts.push(await toString(branch, a, ctx));
            }

            const checked = await (ctx?.checked || (await branch.data.checked)).has(v.id);
            return (checked?'@' :"")
                + `${d ? v.id || "" : ""}(${ts.join(" ")})`;
        }
        case GLOBAL_VAR:
        case LOCAL_VAR: {
            let vd;
            if (v.domain) {
                vd = await getVariable(branch, v.domain, ctx);
            }

            // const ds = vd?':' + (vd.type === GLOBAL_VAR?'$':"'") + vd.varname : '';
            const ds = vd?':' + vd.id : '';

            return "'" + (!v.pv && v.id?v.id + "::": "") + v.varname + ds;
/*
            throw 'TO STRING VARIABLE NOT DEFINED!';
            const domainArray = v.d ? (await v.d.toArray()).sort(): undefined;
            const domain = domainArray ? (await Promise.all(domainArray.map(id => toString(branch, id, ctx)))).filter(v => v !== ''):undefined;
            const ds = domain && domain.length?`:{${domain.join(" ")}}`:"";

            let e = "";
            if (constraints) { 
                const es = v.e ? 
                    (await Promise.all(
                        (await v.e.toArray())
                        .map(cID => toStringconstraints(branch, v, cID, ctx)))).filter(v => v !== '')
                    : undefined;
                // const es = v.e ? (await Promise.all(v.e.map(id => toString(branch, id, ctx, stop)))).filter(v => v !== ''):undefined;
                e = es && es.length?`~{${[...new Set(es)].join(" ")}}`:"";
            }

            return "'" + (!v.pv && v.id?v.id + "::": "") + v.v + ds + e;
 */
        }
        case CONSTANT: {
            return v.data;
        }
        default:
            throw `Base toString: Unknow Type ${v.type}`;
    }
}

module.exports = {
    varGenerator, 
//     type,
    getVariable,
    hasVariable,
    get,
    copyTerm,
    // copyTerms,
    toString,
    getConstantVarname
    // prepareVariables
};