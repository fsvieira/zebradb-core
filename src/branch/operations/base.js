const {
    type: {
        CONSTANT, // : "c",
        TUPLE, // : "t",
        CONSTRAINT, // : "cs",
        SET, // : "s",
        SET_EXP, // 'se',
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

async function getContextState(ctx) {
    console.log("getContextState", {
        setsInDomains: await ctx.setsInDomains.size,
        unsolvedConstraints: await ctx.unsolvedConstraints.size,
        extendSets: await ctx.extendSets.size,
        unsolvedVariables: await ctx.unsolvedVariables.size
    });

    return (
        await ctx.setsInDomains.size ||
        // await ctx.unchecked.size ||
        await ctx.unsolvedConstraints.size ||
        await ctx.extendSets.size ||
        await ctx.unsolvedVariables.size
    ) ? 'maybe' : 'yes';

}


async function logger(options, ctx, message) {
    if (options && options.log) {
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

async function __del_save2db (
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
    else if (v.type === SET) {
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

async function __del_copySetConstraints (
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

async function createMaterializedSet (
    ctx, definitionElement, vn,
    getVarname, v,
    extendSets,
    preserveVarname
) {

    // const {element: elementID} = v;
    const { 
        elements : setElements, 
        size,
        expression,
        indexes,
        domain
    } = v;
        
    if (indexes) {
        await ctx.logger(`Create Indexes : ${JSON.stringify(indexes)}`);
    }

    let elements = ctx.rDB.iSet();
    if (!expression) {
        for (let i=0; i<setElements.length; i++) {
            const elementID = setElements[i];
            const element = await getVarname(elementID, extendSets);
            elements = await elements.add(element);
        }
    }
    else if (extendSets && size === -1) {
        // ctx.extendSets = await ctx.extendSets.add(vn);
        await ctx.addExtendSet(vn);
    }
    
    const domainID = await getVarname(domain);

    const valueResults = {
        type: MATERIALIZED_SET,
        id: vn,
        elements,
        defID: v.cid,
        definition: expression ? definitionElement : null,
        domain: domainID,
        size
    };

    if (v.domain && v.type === SET) {
        // ctx.setsInDomains = await ctx.setsInDomains.add(vn);
        await ctx.addSetInDomain(vn);
    }

    await ctx.setVariableValue(vn , valueResults);

    return vn;
}


async function copyPartialTermGlobalVar (
    ctx, p, vn, getVarname, v, extendSets, preserveVarname
) {
    if (!await ctx.hasVariable(vn)) {

        // const def = await definitionDB.search(v);
        const def = await ctx.search(v);
        const root = def.variables[def.root];

        // let value;
        let vID;
        switch (root.type) {
            case SET: {
                vID = await copyPartialTerm(ctx, def, def.root, false, true);
                break;
            }
            /*case SET: {
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
            }*/

            default:
                throw 'copyPartialTermGlobalVar not implemented type ' + root.type;
        }

        // ctx.variables = await ctx.variables.set(vn, value);
        /*ctx.variables = await ctx.variables.set(vn, {
            ...v,
            defer: vID
        });*/
        await ctx.setVariableValue(vn, {
            ...v,
            defer: vID
        });
    }/*
    else {
        const v = await ctx.variables.get(vn);
        throw 'copyPartialTermGlobalVar IS DONE ??';
    }*/

}

async function copyPartialTermConstraint (
    ctx, p, vn, getVarname, v, extendSets, preserveVarname
) {
    const av = p.variables[v.a];
    const bv = p.variables[v.b];
    const a = await getVarname(av, extendSets);
    const b = await getVarname(bv, extendSets);
    
    if (av.type === LOCAL_VAR) {
        // ctx.unsolvedVariables = await ctx.unsolvedVariables.add(a);
        await ctx.addUnsolvedVariable(a);
    }

    if (bv.type === LOCAL_VAR) {
        await ctx.addUnsolvedVariable(b);
        // ctx.unsolvedVariables = await ctx.unsolvedVariables.add(b);
    }

    const root = v.root?{
        ...v.root,
        csID: await getVarname(p.variables[v.root.csID], extendSets)
    }:null;
    
    let constraints;
    if (v.constraints) {
        constraints = ctx.rDB.iSet();
    
        for (let i=0; i<v.constraints.length; i++) {
            const vc = v.constraints[i];
            const id = await getVarname(p.variables[vc], extendSets);
            constraints = await constraints.add(id);
        }
    }

    await ctx.setVariableValue(vn, {
        ...v,
        a, b, root,
        constraints,
        id: vn
    }); 

    /*
    ctx.variables = await ctx.variables.set(vn, {
        ...v,
        a, b, root,
        constraints,
        id: vn
    });*/

    // ctx.unsolvedConstraints = await ctx.unsolvedConstraints.add(vn);
    await ctx.addUnsolvedConstraint(vn);
}

async function copyPartialTermConstant (
    ctx, p, vn, getVarname, v, extendSets, preserveVarname
) {
    await ctx.setVariableValue(vn, {
        ...v,
        id: vn
    });

    /*ctx.variables = await ctx.variables.set(
        vn, {
            ...v,
            id: vn
        }
    );*/
}

async function copyPartialTermTuple (
    ctx, p, vn, getVarname, v, extendSets, preserveVarname
) {
    const data = [];
    for (let i=0; i<v.data.length; i++) {
        data.push(await getVarname(p.variables[v.data[i]], extendSets));
    }

    /*
    ctx.variables = await ctx.variables.set(
        vn, {
            ...v,
            data,
            pv: preserveVarname,
            id: vn
        }
    );*/

    await ctx.setVariableValue(
        vn, {
            ...v,
            data,
            pv: preserveVarname,
            id: vn
        }
    );
}

async function copyPartialTermLocalVar (
    ctx, p, vn, getVarname, v, extendSets, preserveVarname
) {
    let constraints;
    if (v.constraints) {
        constraints = ctx.rDB.iSet();

        for (let i=0; i<v.constraints.length; i++) {
            const vc = v.constraints[i];
            const id = await getVarname(p.variables[vc], extendSets);
            constraints = await constraints.add(id);
        }
    }

    const domain = await getVarname(v.domain, false);   
    /*ctx.variables = await ctx.variables.set(
        vn, {
            ...v,
            pv: preserveVarname,
            domain,
            constraints,
            id: vn
        }
    );*/
    await ctx.setVariableValue(
        vn, {
            ...v,
            pv: preserveVarname,
            domain,
            constraints,
            id: vn
        }
    );

    if (v.constraints && v.domain ) {
        // ctx.unsolvedVariables = await ctx.unsolvedVariables.add(vn);
        ctx.addUnsolvedVariable(vn);
    }
}

async function copyPartialIndex (
    ctx, p, vn, getVarname, v, extendSets, preserveVarname
) {

    const variable = await getVarname(p.variables[v.variable], false);
    const setID = await getVarname(p.variables[v.setID], false);
    const eID = await getVarname(p.variables[v.eID], extendSets);

    const values = [];
    for (let i=0; i<v.variables.length; i++) {
        varID = v.variables[i];
        values.push(await getVarname(p.variables[varID], extendSets));
    }
    
    /*ctx.variables = await ctx.variables.set(vn, {
        ...v,
        variable,
        values,
        setID,
        eID
    });*/

    await ctx.setVariableValue(vn, {
        ...v,
        variable,
        values,
        setID,
        eID
    });

}

async function copyPartialTerm (
    ctx, p, vID, 
    extendSets=false,
    preserveVarname=false
) {

    const {variables} = p;
    const mapVars = {};

    const getVarname = async (v, extendSets=false) => {
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
                            ctx, p, vn,
                            getVarname, v,
                            extendSets,
                            preserveVarname
                        );

                        break;
                    }

                    case CONSTRAINT: {
                        vn = mapVars[cid] = v.type + '::' + ctx.newVar();

                        await copyPartialTermConstraint(
                            ctx, p, vn,
                            getVarname, v, 
                            extendSets,
                            preserveVarname
                        );

                        break; 
                    }

                    case GLOBAL_VAR: {
                        vn = mapVars[cid] = cid;

                        await copyPartialTermGlobalVar(
                            ctx, p, vn,
                            getVarname, v,
                            extendSets,
                            preserveVarname
                        );

                        break;
                    }

                    case SET: {
                        vn = mapVars[cid] = v.type + '::' + ctx.newVar();

                        await createMaterializedSet(
                            ctx, p, vn,
                            getVarname, v,
                            extendSets,
                            preserveVarname
                        );

                        break;
                    }

                    case TUPLE: {
                        vn = mapVars[cid] = v.type + '::' + ctx.newVar();

                        await copyPartialTermTuple(
                            ctx, p, vn,
                            getVarname, v,
                            extendSets,
                            preserveVarname
                        );

                        break;
                    }

                    case INDEX: {
                        vn = mapVars[cid] = v.type + '::' + ctx.newVar();

                        await copyPartialIndex(
                            ctx, p, vn,
                            getVarname, v, 
                            extendSets,
                            preserveVarname
                        );

                        break;
                    }

                    case CONSTANT: {
                        vn = cid;

                        await copyPartialTermConstant(
                            ctx, p, vn,
                            getVarname, v,
                            extendSets,
                            preserveVarname
                        );

                        break;
                    }

                    default:
                        throw 'copyPartialTerm type is not defined: ' + v.type;
                }
            }

            return vn;
        }
    }

    return getVarname(vID, extendSets);
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

    if (v.type === SET) {
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

async function __getVariable (branch, id, ctx) {
    let v;
    const variables = ctx ? ctx._ctx.variables : await branch.data.variables;

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
    throw 'get : depreate this or make it specialized!'
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

    const s = ['', 'FALSE', 'TRUE', 'UNK'];
    return `[ ${a} ${v.op} ${b} ] (${s[v.state || 0]})`; 
}

async function toStringMaterializedSet(branch, v, ctx) {
    const {size, domain} = v;

    const elements = [];
    for await (let e of v.elements.values()) {
        elements.push(await toString(branch, e, ctx));
    }

    const expand = size < 0? ' ...':'';
    // const domainStr = domain ? `:${await toString(branch, domain, ctx)}`:'';
    const domainStr = domain ? `:${domain}` : '';

    return `{${elements.sort().join(" ")}${expand}}${domainStr}`;
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

    throw 'SC ????' + JSON.stringify(v);
}

async function __toString (branch, id, ctx, constraints=true) {
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
            const checked = await (ctx?.checked || (await branch.data.checked)).has(v.id);
            const ms = await toStringMaterializedSet(branch, v, ctx); 
            return (checked?'@' :"") + ms;

            // return toStringMaterializedSet(branch, v, ctx);
        }

        case SET: {
            return toStringSet(branch, v, ctx);
        }

        /*case SET_CS: {
            return toStringSetCs(branch, v, ctx);
        }*/

        default:
            throw `Base toString: Unknow Type ${v.type}`;
    }
}

module.exports = {
    varGenerator, 
    // type,
    // getVariable,
    hasVariable,
    get,
    copyTerm,
    copyPartialTerm,
    // copyTerms,
    // toString,
    getConstantVarname,
    copyPartialTerm,
    createMaterializedSet,
    logger,
    getContextState
    // prepareVariables
};