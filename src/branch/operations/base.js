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
        INDEX, // idx
        SET_SIZE
    },
    operation: {
        OR,
        AND,
        IN
    }
} = require("./constants");

const { v4: uuidv4 } = require('uuid');

async function getContextState(ctx) {
    /*console.log("getContextState", {
        setsInDomains: await ctx.setsInDomains.size,
        unsolvedConstraints: await ctx.unsolvedConstraints.size,
        extendSets: await ctx.extendSets.size,
        unsolvedVariables: await ctx.unsolvedVariables.size
    });*/

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
        domain,
        constraints : setConstraints
    } = v;
        
    if (indexes) {
        await ctx.logger(`Create Indexes : ${JSON.stringify(indexes)}`);
    }

    let constraints;
    if (setConstraints) {
        constraints = ctx.rDB.iSet();

        for (let i=0; i<setConstraints.length; i++) {
            const vc = setConstraints[i];
            const id = await getVarname(definitionElement.variables[vc], extendSets);
            constraints = await constraints.add(id);
        }
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
        uniqueMap: ctx.rDB.iMap(),
        matrix: {
            elements: [],
            indexes: {},
            uniqueElements: {}
        },
        constraints,
        size
    };

    if (v.domain && v.type === SET) {
        // ctx.setsInDomains = await ctx.setsInDomains.add(vn);
        await ctx.addSetInDomain(vn);
    }

    await ctx.setVariableValue(vn , valueResults);

    return vn;
}

async function copyPartialTermSetSize (
    ctx, p, vn, getVarname, v, extendSets, preserveVarname
) {
    const variable = await getVarname(v.variable, extendSets);

    await ctx.setVariableValue(vn, {
        ...v,
        variable,
        id: vn
    });
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

            default:
                throw 'copyPartialTermGlobalVar not implemented type ' + root.type;
        }

        await ctx.setVariableValue(vn, {
            ...v,
            defer: vID
        });
    }
}

async function copyPartialTermConstraint (
    ctx, p, vn, getVarname, v, extendSets, preserveVarname
) {
    const av = p.variables[v.a];
    const bv = p.variables[v.b];
    const a = await getVarname(av, extendSets);
    const b = await getVarname(bv, extendSets);
    
    /*if (av.type === LOCAL_VAR) {
        // ctx.unsolvedVariables = await ctx.unsolvedVariables.add(a);
        await ctx.addUnsolvedVariable(a);
    }

    if (bv.type === LOCAL_VAR) {
        await ctx.addUnsolvedVariable(b);
        // ctx.unsolvedVariables = await ctx.unsolvedVariables.add(b);
    }*/

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

    const domain = v.domain ? await getVarname(v.domain) : undefined;

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
            domain,
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
        await ctx.addUnsolvedVariable(vn);
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
    preserveVarname=false,
    mapVars={}
) {

    const { variables } = p;
    // const mapVars = {};

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

                    case SET_SIZE: {
                        vn = mapVars[cid] = v.type + '::' + ctx.newVar();

                        await copyPartialTermSetSize(
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