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
        DEF_REF, // d,
        MATERIALIZED_SET, // 'ms',
        INDEX // idx
    },
    operation: {
        OR,
        AND,
        IN
    }
} = require("./constants");

const { v4: uuidv4 } = require('uuid');


async function logger(options, ctx, message) {
    if (options.log) {
        const stack = new Error().stack;
        ctx.log = await ctx.log.push(message + "\nSTACK=" + stack);
    }

    return ctx.log;
}

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

        const domain = await getVarname(p.variables[v.domain]); 
        ctx.variables = await ctx.variables.set(vn, {
            ...v,
            data: v.data.map(v => getVarname(p.variables[v])),
            // body,
            id: vn,
            domain
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

            const el = def.variables[def.root];
            if (el.type === TUPLE) {
                const checked = el.checked;

                if (checked) {
                    ctx.checked = await ctx.checked.add(vn);
                }
                else {
                    ctx.unchecked = await ctx.unchecked.add(vn);
                }
            }    
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

        const vs = v.cid === v.variable ? v : p.variables[variableID];

        if (vs.type === GLOBAL_VAR) {
            const hasVar = await hasVariable(null, variableID, ctx); 
            let gv = hasVar?await getVariable(null, variableID, ctx):null;

            if (!gv || gv.type === GLOBAL_VAR) {
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
            const id = getVarname(vs);
            ctx.variables = await ctx.variables.set(id, {
                ...v,
                // body,
                // element: getVarname(p.variables[v.element]),
                id
            });
        }
    }
    else if (v.type === CONSTRAINT) {
        const a = getVarname(p.variables[v.a]);
        const b = getVarname(p.variables[v.b]);
        const root = v.root?{
            ...v.root,
            csID: getVarname(p.variables[v.root.csID])
        }:null;

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
            a, b, root,
            constraints,
            id: vn
        });

    }
    else {
       throw 'COPY TERM CANT COPY ' + v.type;
    }
}

async function copySetConstraints (
    ctx, p, preserveVarname, 
    getVarname, 
    v, vn,
    definitionsDB
) {
    const variableID = v.variable;
    const vs = p.variables[variableID];

    if (vs.type === GLOBAL_VAR) {
        const hasVar = await hasVariable(null, variableID, ctx); 
        let gv = hasVar?await getVariable(null, variableID, ctx):null;

        if (!gv || gv.type === GLOBAL_VAR) {
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

async function copySetCs (
    definitionDB, ctx, p, vn, getVarname, v, preserveVarname
) {
    const element = await getVarname(p.variables[v.element]);

    const valueResults = {
        type: MATERIALIZED_SET,
        id: vn,
        elements: await ctx.rDB.iSet().add(element)
    };

    ctx.variables = await ctx.variables.set(vn, valueResults);
}

async function createMaterializedSetCs (
    ctx,
    definitionsDB,
    definitionElement, 
    v,
    variableID=ctx.newVar()
) {

    const {element: elementID} = v;

    const element = await copyPartialTerm(
        ctx, 
        definitionElement, 
        elementID,
        definitionsDB, 
        true
    );
    
    const valueResults = {
        type: MATERIALIZED_SET,
        id: variableID,
        elements: await ctx.rDB.iSet().add(element)
    };

    ctx.variables = await ctx.variables.set(variableID, valueResults);

    console.log("SHOULD createMaterializedSet be replace with copy term??? copySetCs");

    return variableID;
}


async function copyPartialTermGlobalVar (
    definitionDB, ctx, p, vn, getVarname, v, preserveVarname
) {
    if (!await ctx.variables.has(vn)) {

        const def = await definitionDB.search(v);
        const root = def.variables[def.root];

        let value;
        switch (root.type) {
            case SET_CS: {
                value = {
                    type: MATERIALIZED_SET,
                    setType: root.type, 
                    id: vn,
                    elements: await ctx.rDB.iSet(),
                    definition: def
                };
                break;
            }

            case SET: {
                value = {
                    type: MATERIALIZED_SET,
                    setType: root.type, 
                    id: vn,
                    elements: await ctx.rDB.iSet(),
                    definition: def
                };
                break;
            }

            default:
                throw 'copyPartialTermGlobalVar not implemented type ' + root.type;
        }

        ctx.variables = await ctx.variables.set(vn, value);
    }
    else {
        const v = await ctx.variables.get(vn);
        console.log("GV ---------->", v);
        throw 'copyPartialTermGlobalVar IS DONE ??';
    }

}

async function copyPartialTermConstraint (
    definitionDB, ctx, p, vn, getVarname, v, preserveVarname
) {

    const a = await getVarname(p.variables[v.a]);
    const b = await getVarname(p.variables[v.b]);
    
    const root = v.root?{
        ...v.root,
        csID: await getVarname(p.variables[v.root.csID])
    }:null;
    
    let constraints;
    if (v.constraints) {
        constraints = ctx.rDB.iSet();
    
        for (let i=0; i<v.constraints.length; i++) {
            const vc = v.constraints[i];
            const id = await getVarname(p.variables[vc]);
            constraints = await constraints.add(id);
        }
        
    }

    ctx.variables = await ctx.variables.set(vn, {
        ...v,
        a, b, root,
        constraints,
        id: vn
    });

    // console.log(JSON.stringify(v, null, '  '));
    // throw 'copyPartialTermConstraint Not implemented';
}

async function copyPartialTermTuple (
    definitionDB, ctx, p, vn, getVarname, v, preserveVarname
) {
    const data = [];
    for (let i=0; i<v.data.length; i++) {
        data.push(await getVarname(p.variables[v.data[i]]));
    }

    ctx.variables = await ctx.variables.set(
        vn, {
            ...v,
            data,
            pv: preserveVarname,
            id: vn
        }
    );
}

async function copyPartialTermLocalVar (
    definitionDB, ctx, p, vn, getVarname, v, preserveVarname
) {
    let constraints;
    if (v.constraints) {
        constraints = ctx.rDB.iSet();

        for (let i=0; i<v.constraints.length; i++) {
            const vc = v.constraints[i];
            const id = await getVarname(p.variables[vc]);
            constraints = await constraints.add(id);
        }
    }

    const domain = await getVarname(v.domain);   
    ctx.variables = await ctx.variables.set(
        vn, {
            ...v,
            pv: preserveVarname,
            domain, /*v.domain ? getVarname(p.variables[v.domain]) : undefined,*/
            constraints,
            id: vn
        }
    );

    if (v.constraints /*&& v.domain*/ ) {
        ctx.unsolvedVariables = await ctx.unsolvedVariables.add(vn);
    }
    /*else if (v.constraints) {
        console.log("TODO: CHECK IF THERE IS CONSTRAINTS LIKE IN ??");
        throw 'PROCESS CONSTRAINTS??';
    }*/
}

async function copyPartialIndex (
    definitionDB, ctx, p, vn, getVarname, v, preserveVarname
) {

    const variable = await getVarname(p.variables[v.variable]);
    const setID = await getVarname(p.variables[v.setID]);

    ctx.variables = await ctx.variables.set(vn, {
        ...v,
        variable,
        setID
    });
}

async function copyPartialTerm (
    ctx, p, vID, definitionDB, preserveVarname=false
) {

    const {variables} = p;
    const mapVars = {};

    /*
    const getVarname = v => {
        const cid = v.cid || v;

        let vn = mapVars[cid];

        if (!vn) {
            if (v.type === GLOBAL_VAR) {
                vn = mapVars[cid] = cid;
            }
            else if (v.type === CONSTANT) {
                vn = mapVars[cid] = ctx.newVar(v.data);
            }
            else {
                vn = mapVars[cid] = ctx.newVar();
            }
        }
 
        return vn;
    }
    */

    const getVarname = async v => {
        if (v) {
            if (!v.cid) {
                v = variables[v];
            }
            
            const cid = v.cid;
            let vn = mapVars[cid];

            if (!vn) {
                switch (v.type) {
                    case LOCAL_VAR: {
                        vn = mapVars[cid] = v.type + '::' + ctx.newVar();

                        await copyPartialTermLocalVar(
                            definitionDB, ctx, p, vn,
                            getVarname, v, 
                            preserveVarname
                        );

                        break;
                    }

                    case CONSTRAINT: {
                        vn = mapVars[cid] = v.type + '::' + ctx.newVar();

                        await copyPartialTermConstraint(
                            definitionDB, ctx, p, vn,
                            getVarname, v, 
                            preserveVarname
                        );

                        break; 
                    }

                    case GLOBAL_VAR: {
                        vn = mapVars[cid] = cid;

                        await copyPartialTermGlobalVar(
                            definitionDB, ctx, p, vn,
                            getVarname, v, 
                            preserveVarname
                        );

                        break;
                    }

                    case SET_CS: {
                        vn = mapVars[cid] = v.type + '::' + ctx.newVar();

                        // await createMaterializedSetCs(ctx, definitionDB, p, v, vn);
                        await copySetCs(
                            definitionDB, ctx, p, vn,
                            getVarname, v, 
                            preserveVarname
                        )
                        break;
                    }

                    case TUPLE: {
                        vn = mapVars[cid] = v.type + '::' + ctx.newVar();

                        await copyPartialTermTuple(
                            definitionDB, ctx, p, vn,
                            getVarname, v, 
                            preserveVarname
                        );

                        break;
                    }

                    case INDEX: {
                        vn = mapVars[cid] = v.type + '::' + ctx.newVar();

                        await copyPartialIndex(
                            definitionDB, ctx, p, vn,
                            getVarname, v, 
                            preserveVarname
                        );

                        break;
                    }

                    case SET:
                        console.log(v);
                        throw 'COPY TERM SET getVarname!!';

                    default:
                        throw 'copyPartialTerm type is not defined: ' + v.type;
                }
            }

            return vn;
        }
    }

    return getVarname(vID);
}

async function copyTerm (ctx, p, definitionsDB, preserveVarname=false) {
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
 
        return vn;
    }

    const {root, variables} = p;
    const v = variables[root];

    if (v.type === SET_CS) {
        const vn = getVarname(v);
        await copySetConstraints(
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

    return mapVars[p.root];
}

function getConstantVarname (constant) {
    return `v$c#${constant}`;
}

function varGenerator (counter) {
    const vID = uuidv4();

    return {
        varCounter: () => counter,
        newVar: v => {
            const varname = (v?getConstantVarname(v):'v$' + vID + '$' + (++counter));
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

/*
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
}*/

async function toStringConstraints (branch, v, ctx) {
    const a = await toString(branch, v.a, ctx);
    const b = await toString(branch, v.b, ctx);

    return `[ ${a} ${v.op} ${b} ]`; 
}

async function toStringMaterializedSet(branch, v, ctx) {
    const elements = [];
    for await (let e of v.elements.values()) {
        elements.push(await toString(branch, e, ctx));
    }

    return `{${elements.sort().join(" ")}}`;
}

async function toStringSet(branch, v, ctx) {
    const elements = [];

    for await (let e of v.elements.values()) {
        elements.push(await toString(branch, e, ctx));
    }

    return `{${elements.sort().join(" ")}}`;
}

async function toStringSetCs(branch, v, ctx) {
//     return `{${JSON.stringify(v.element)} |}`;

    console.log(JSON.stringify(v));
    throw 'SC ????' + JSON.stringify(v);
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
            /*let vd;
            if (v.domain) {
                vd = await getVariable(branch, v.domain, ctx);
            }*/

            // const ds = vd?':' + (vd.type === GLOBAL_VAR?'$':"'") + vd.varname : '';
            const ds = v.domain?':' + await toString(branch, v.domain, ctx):''; // vd?`:{${vd.elements.join(", ")}}` : '';

            return "'" + (!v.pv && v.id?v.id + "::": "") + v.varname + ds;
        }
        case CONSTANT: {
            return v.data;
        }
        case CONSTRAINT: {
            return toStringConstraints(branch, v, ctx);
        }

        case MATERIALIZED_SET: {
            return toStringMaterializedSet(branch, v, ctx);
        }

        case SET: {
            return toStringSet(branch, v, ctx);
        }

        case SET_CS: {
            return toStringSetCs(branch, v, ctx);
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
    copyPartialTerm,
    // copyTerms,
    toString,
    getConstantVarname,
    copyPartialTerm,
    createMaterializedSetCs,
    logger
    // prepareVariables
};