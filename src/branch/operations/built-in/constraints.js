const constants = require("../constants");
const {
    varGenerator, 
    type,
    get,
    copyTerm,
    copyPartialTerm,
    toString,
    getVariable,
    getConstantVarname,
    logger
} = require("../base");

const {
    type: {
        CONSTANT, // : "c",
        TUPLE, // : "t",
        CONSTRAINT, // : "cs",
        SET, // : "s",
        LOCAL_VAR, // : 'lv',
        GLOBAL_VAR, // : 'gv',
        DEF_REF, // d
        MATERIALIZED_SET, // ms
        SET_SIZE // ss
    },
    operation: {
        OR, // "or",
        AND, // "and",
        IN, // "in",
        UNIFY, // "=",
        NOT_UNIFY, // "!=",
        UNION, // "union",
        ADD, // '+',
        SUB, // '-',
        MUL, // '*'
        DIV,
        MOD,
        FUNCTION,
        BELOW, // '<',
        BELOW_OR_EQUAL, // '<=',
        ABOVE, // '>',
        ABOVE_OR_EQUAL, // >= 
        UNIQUE
    },
    values: {
        C_FALSE,
        C_TRUE,
        C_UNKNOWN
    }
} = constants;

/*
    Set Variable
*/
async function intersectDomains(ctx, a, b) {
    if (a.domain && b.domain) {

        if (a.domain === b.domain) {
            return a.domain;
        }
        else {
            const domainA = await ctx.getVariable(a.domain); 
            const domainB = await ctx.getVariable(b.domain); 

            if (domainA.type === MATERIALIZED_SET && domainB.type === MATERIALIZED_SET) {
                const elementsA = [];
                let elements = ctx.rDB.iSet();

                for await (let eID of domainA.elements.values()) {
                    const v = await ctx.getVariable(eID);
                    elementsA.push(v.id);
                }

                for await (let eID of domainB.elements.values()) {
                    const v = await ctx.getVariable(eID);
                    if (elementsA.includes(v.id)) {
                        elements = await elements.add(v.id);
                    }
                }

                // const elementsIDs = domainA.elements.filter(v => domainB.elements.includes(v));
                const size = await elements.size;
                if (size === 0) {
                    return null;
                }

                const id = ctx.newVar();
                const s = {
                    type: MATERIALIZED_SET,
                    elements,
                    id,
                    size
                };

               //  ctx.variables = await ctx.variables.set(id, s);

                await ctx.setVariableValue(id, s);
                return id;
            }
            else {
                throw `Intersect domain's ${domainA.type} x ${domainA.type} not implemented`;
            }
        }
    }

    return b.domain || a.domain;
    
}

async function setVariableLocalVarConstant (ctx, v, c) {
    if (v.domain) {
        // const d = await getVariable(null, v.domain, ctx);
        const d = await ctx.getVariable(v.domain);
        
        switch (d.type) {
            case MATERIALIZED_SET:
            // case SET:
                if (!(await d.elements.has(c.id))) {
                    return false;
                }

                break;
            

            default:
                throw `setVariableLocalVarConstant Domain ${d.type} not defined!`;
        }
    }

    // ctx.variables = await ctx.variables.set(v.id, {...v, defer: c.id});
    await ctx.setVariableValue(v.id, {...v, defer: c.id});
    await ctx.removeUnsolvedVariable(v.id);

    if (v.constraints) {
        const r = await checkVariableConstraints(ctx, v);

        if (r === false) {
            return r;
        }
    }

    return true;
}

async function setVariableLocalVarTuple (ctx, v, t) {
    if (v.domain) {
        const d = await ctx.getVariable(v.domain);

        throw `setVariableLocalVarTuple Domain ${d.type} not defined!`;
    }

    // ctx.variables = await ctx.variables.set(v.id, {...v, defer: t.id});
    await ctx.setVariableValue(v.id, {...v, defer: t.id});

    if (v.constraints) {
        const r = await checkVariableConstraints(ctx, v);

        if (r === false) {
            return r;
        }
    }

    return true;
}

async function setVariableLocalVarLocalVar (ctx, v, p) {
    let a = p.pv ? p : v;
    let b = p.pv ? v : p;

    const domain = await intersectDomains(ctx, a, b);

    if (domain === null) {
        return false;
    }

    const aDomain = (domain && a.domain !== domain)?domain:null;

    let aConstraints;
    if (b.constraints) {
        if (!a.constraints) {
            aConstraints = b.constraints;
        }
        else {
            aConstraints = a.constraints;

            for await (let csID of b.constraints.values()) {
                aConstraints = await aConstraints.add(csID);
            }
        }
    }

    if (aDomain || aConstraints) {
        /*
        ctx.variables = await ctx.variables.set(a.id, {
            ...a,
            domain: aDomain || a.domain,
            constraints: aConstraints || a.constraints
        });*/
        await ctx.setVariableValue(a.id, {
            ...a,
            domain: aDomain || a.domain,
            constraints: aConstraints || a.constraints
        });
    }

    // ctx.variables = await ctx.variables.set(b.id, {...b, defer: a.id});
    await ctx.setVariableValue(b.id, {...b, defer: a.id});

    return true;
}


const setVariable = async (ctx, v, p) => {

    if (v.id !== p.id) {
        switch (v.type) {
            case LOCAL_VAR:
                switch (p.type) {
                    case LOCAL_VAR: return await setVariableLocalVarLocalVar(ctx, v, p);
                    case CONSTANT: return await setVariableLocalVarConstant(ctx, v, p);
                    case TUPLE: return await setVariableLocalVarTuple(ctx, v, p);
                    default: 
                        throw `Set Variable [LOCAL_VAR] x ${p.type} not implemented`;
                }

            default:
                throw `Set Variable ${v.type} x ${p.type} not implemented`
        }
    }
    
    return true; 
}

function getBoolValue (v) {
    if (v.type === CONSTANT) {
        return C_TRUE;
    }
    else if (
        v.type === CONSTRAINT
    ) {
        return v.state || C_UNKNOWN;
    }

    return C_UNKNOWN;
}

function getValue (v) {
    if (v.type === CONSTANT) {
        return v.data;
    }
    else if (v.type === SET_SIZE && v.value >= 0) {
        return v.value;
    }
    else if (
        v.type === CONSTRAINT && 
        v.state === C_TRUE && 
        v.value !== undefined
    ) {
        return v.value;
    }

    return null;
}

function getNumber (v) {
    const n = getValue(v);

    if (n !== null) {
        const r = parseFloat(n);
        if (!isNaN(r)) {
            return r;
        }

        return null;
    }

    return n;
}

async function getConstant (ctx, string) {
    const vID = getConstantVarname(string);

    // if (!(await ctx.variables.has(vID))) {
    if (!(await ctx.hasVariable(vID))) {
        const c = {
            type: CONSTANT,
            data: string,
            id: vID
        };

        // ctx.variables = await ctx.variables.set(vID, c);
        await ctx.setVariableValue(vID, c);

        return c;
    }

    return ctx.getVariable(vID);//await ctx.variables.get(vID);
}

async function checkUniqueIndexConstrain (ctx, cs, env) {
    const {
        variables, 
        values, 
        setID,
        eID,
        uniqueElementIndex
    } = cs;

    const set = await ctx.getVariable(setID);

    // get the element index,
    /*const def = set.definition.variables[set.defID];

    let maxIndex = 0;
    for (let i=0; i<def.indexes.length; i++) {
        const idxID = def.indexes[i];
        const idx = set.definition.variables[idxID];
        maxIndex = Math.max(maxIndex, idx.variables.length);
    }*/

    let indexValues = [];
    let indexNames = [];
    for (let i=0; i<values.length; i++) {
        const v = await ctx.getVariable(values[i]);
        const varName = variables[i];

        indexNames.push(varName);

        if (v.type === CONSTANT) {
            indexValues.push(`${varName}:${v.id}`);
        }
        else {
            console.log("TODO: checkUniqueIndexConstrain INDEX type " + v.type);
            return C_UNKNOWN;
        }
    }

    const indexKey = indexValues.join("-");
    const indexName = indexNames.join(":");

    if (await set.uniqueMap.has(indexKey)) {
        return C_FALSE;
    }
    else {
        const uniqueMap = await set.uniqueMap.set(indexKey, eID);

        let uniqueElements = set.matrix.uniqueElements;
        let elements = []; 

        if (uniqueElementIndex) {
            uniqueElements = {
                ...uniqueElements, 
                [indexKey]: eID
            };

            elements.push(eID);
        }
        /*
        if (indexValues.length === maxIndex) {
            uniqueElements = {
                ...uniqueElements, 
                [indexKey]: eID
            };
        }*/

        let matrix = {
            elements: elements.concat(set.matrix.elements),
            uniqueElements,
            indexes: {
                ...set.matrix.indexes,
                [eID]: (set.matrix.indexes[eID] || []).concat(indexKey),
            }
        };

        await ctx.setVariableValue(set.id, {
            ...set,
            uniqueMap,
            matrix
        });

        return C_TRUE;
    }
}

async function checkNumberRelationConstrain(ctx, cs, env) {
    const {a, op, b, id} = cs;
    const av = await ctx.getVariable(a);// await getVariable(null, a, ctx);
    const bv = await ctx.getVariable(b)// await getVariable(null, b, ctx);

    const an = getNumber(av);
    const bn = getNumber(bv);

    let state;
    if (isNaN(an) || isNaN(bn)) {    
        state = C_FALSE;
    }
    else if (an === null || bn === null) {
        state = C_UNKNOWN;
    }

    if (state !== undefined) {
        if (state !== C_UNKNOWN) {
            /*ctx.variables = await ctx.variables.set(cs.id, {
                ...cs, state
            });*/
            await ctx.setVariableValue(cs.id, {
                ...cs, state
            });
        }

        return state;
    }

    state = C_TRUE;

    switch (op) {        
        case BELOW:
            state = an < bn?C_TRUE:C_FALSE;
            break;

        case BELOW_OR_EQUAL:
            state = an <= bn?C_TRUE:C_FALSE;
            break;

        case ABOVE:
            state = an > bn?C_TRUE:C_FALSE;
            break;

        case ABOVE_OR_EQUAL:
            state = an >= bn?C_TRUE:C_FALSE;
            break;
   }

   /*ctx.variables = await ctx.variables.set(cs.id, {
        ...cs, state
   });*/
   await ctx.setVariableValue(cs.id, {
        ...cs, state
   });

   return state;
}

async function checkNumberOperationsConstrain(ctx, cs, env) {
    const {a, op, b, id} = cs;
    const av = await ctx.getVariable(a);
    const bv = await ctx.getVariable(b);

    const an = getNumber(av);
    const bn = getNumber(bv);

    let state;
    if (isNaN(an) || isNaN(bn)) {    
        state = C_FALSE;
    }
    else if (an === null || bn === null) {
        state = C_UNKNOWN;
    }

    // await debugConstraint(ctx, cs.id, state, 'MATH OP [START]');

    if (state !== undefined) {
        if (state !== C_UNKNOWN) {
            /*ctx.variables = await ctx.variables.set(cs.id, {
                ...cs, state
            });*/
            await ctx.setVariableValue(cs.id, {
                ...cs, state
            });
        }

        return state;
    }

    let r;
    state = C_TRUE;
    switch (op) {
        case ADD:
            r = an + bn; 
            break;

        case SUB:
            r = an - bn;
            break;

        case MUL:
            r = an * bn;
            break;

        case DIV: 
            r = an / bn;
            break;

        case MOD:
            r = an % bn;
            break;        
   }

   // await debugConstraint(ctx, cs.id, state, 'MATH OP');
   
   /*ctx.variables = await ctx.variables.set(cs.id, {
        ...cs, state, value: r.toString()
   });*/

   await ctx.setVariableValue(cs.id, {...cs, state, value: r.toString()});

   return state;
}

async function excludeFromDomain (ctx, v, d, cs) {
    const domain = await getVariable(null, d.domain, ctx);

    if (domain.type === SET) {
        const index = domain.elements.findIndex(vID => vID === v.id);

        if (index >= 0) {
            const es = domain.elements.slice();
            es.splice(index, 1);

            if (es.length === 1) {
                const v = await getVariable(null, es[0], ctx);

                const r = await setVariableLocalVarConstant(ctx, d, v);

                return r?C_TRUE:C_FALSE;
            }
            else {
                // 1. create a new domain variable, 
                const id = ctx.newVar();
                const s = {
                    type: SET,
                    elements: es,
                    id,
                    size: es.length
                };

                ctx.variables = await ctx.variables.set(id, s);

                // 2. remove a constraints,
                const constraints = await d.constraints.remove(cs.id);

                // 3. save modifications,
                ctx.variables = await ctx.variables.set(d.id, {
                    ...d, 
                    constraints: constraints.size === 0?undefined:constraints,
                    domain: id
                });
            }
        }

        // 4. set constraint to true,
        /*
            const vc = await getConstant(ctx, '1');
            const ok = await setVariable(ctx, cs, vc);

        if (ok) {
            return C_TRUE;
        }
        else {
            return C_FALSE;
        }*/
        return C_TRUE;
    }
    
    throw 'Exclude value from domain not done for type ' + domain.type;
}

async function checkVariableConstraintsNotUnify (ctx, cs) {
    const {a, op, b, id} = cs;
    const av = await ctx.getVariable(a);
    const bv = await ctx.getVariable(b);

    const sa = getValue(av);
    const sb = getValue(bv);

    let state = C_UNKNOWN;

    if (av.id === bv.id) {
        state = C_FALSE;
    }
    else if (sa !== null && sb !== null) {
        state = sa !== sb ? C_TRUE : C_FALSE;
    }

    console.log("TODO: exclude from domain!!");
    
    /*
    else if (sa !== null && bv.domain) {
        state = await excludeFromDomain(ctx, av, bv, cs);
    }
    else if (sb !== null && av.domain) {
        state = await excludeFromDomain(ctx, bv, av, cs);
    }*/

    if (state !== C_UNKNOWN) {
        await ctx.setVariableValue(cs.id, {
            ...cs, state
        });

        /*
        ctx.variables = await ctx.variables.set(cs.id, {
            ...cs, state
        });*/
    }

    return state;

}

async function checkAndConstrain (ctx, cs, env) {
    const {a, op, b, id} = cs;
    // const av = await getVariable(null, a, ctx);
    // const bv = await getVariable(null, b, ctx);
    const av = await ctx.getVariable(a);
    const bv = await ctx.getVariable(b);

    const sa = getBoolValue(av);
    const sb = getBoolValue(bv);

    let state = C_UNKNOWN;
    
    if (sa === C_FALSE || sb === C_FALSE) {
        state = C_FALSE;
    }
    else if (sa === C_TRUE && sb === C_TRUE) {
        state = C_TRUE;
    }
    else if (sa !== C_UNKNOWN) {
        await ctx.setVariableValue(cs.id, {
            ...cs, state, aValue: sa
        });

        /*ctx.variables = await ctx.variables.set(cs.id, {
            ...cs, state, aValue: sa
        });*/
    }
    else if (sb !== C_UNKNOWN) {
        await ctx.setVariableValue(cs.id, {
            ...cs, state, bValue: sb
        });

        /*ctx.variables = await ctx.variables.set(cs.id, {
            ...cs, state, bValue: sb
        });*/
    }
    
    if (state !== C_UNKNOWN) {
        await ctx.setVariableValue(cs.id, {
            ...cs, state,
            aValue: sa, bValue: sb
        });

/*        ctx.variables = await ctx.variables.set(cs.id, {
            ...cs, state,
            aValue: sa, bValue: sb
        });*/
    }

    // await debugConstraint(ctx, cs.id, state, 'AND');

    return state;
}

async function checkOrConstrain (ctx, cs) {
    const {a, op, b, id} = cs;
    // const av = await getVariable(null, a, ctx);
    // const bv = await getVariable(null, b, ctx);
    const av = await ctx.getVariable(a);
    const bv = await ctx.getVariable(b);

    const sa = getBoolValue(av);
    const sb = getBoolValue(bv);

    let state = C_UNKNOWN;

    if (sa === C_TRUE || sb === C_TRUE) {
        state = C_TRUE;
    }
    else if (sa === C_FALSE && sb === C_FALSE) {
        state = C_FALSE;
    }
    else if (sa !== C_UNKNOWN) {
        await ctx.setVariableValue(cs.id, {
            ...cs, state, aValue: sa
        });
    }
    else if (sb !== C_UNKNOWN) {
        await ctx.setVariableValue(cs.id, {
            ...cs, state, bValue: sb
        });
    }

    if (state !== C_UNKNOWN) {
        await ctx.setVariableValue(cs.id, {
            ...cs, state
        });
    }

    return state;
}

async function checkVariableConstraintsIn (definitionDB, ctx, cs, env) {
    const {a, op, b, id, root} = cs;
    const av = await ctx.getVariable(a);
    const bv = await ctx.getVariable(b);

    // const sa = getValue(av);
    // const sb = getValue(bv);

    let state = C_UNKNOWN;

    //1. check if element is already on set.
    let termID;
    if (bv.type === MATERIALIZED_SET) {
        const {definition: {variables, root}} = bv;

        const rootEl = variables[root];
        if (rootEl.type === SET) {

            termID = await copyPartialTerm(
                ctx, 
                bv.definition, 
                rootEl.element,
                definitionDB,
                true,
                true
            );

            // throw 'checkVariableConstraintsIn : Copy Element!! // SHOULD INDEXES BE ON TUPLE OR SET ??';
        }
        else {
            throw `checkVariableConstraintsIn : Check def Type ${rootEl.type} Not implemented`;
        }
    }
    else {
        throw `checkVariableConstraintsIn : Type ${bv.type} Not implemented`;
    }

    console.log("TODO: CHECK IF ELEMENT IS ALREADY ON SET.");
    throw "TODO: unify av with termID ??";

    ctx.variables = await ctx.variables.set(av.id, {
        ...av, defer: termID
    });

    if (!(await bv.elements.has(termID))) {
        if (env.eval) {
            const elements = await bv.elements.add(termID);
    
            ctx.variables = await ctx.variables.set(bv.id, {
                ...bv,
                elements
            });

            state = C_TRUE;
        }     
    }
    else {
        state = C_TRUE;
    }


    if (state !== C_UNKNOWN) {
        ctx.variables = await ctx.variables.set(cs.id, {
            ...cs, state
        });
    }

    // throw 'checkVariableConstraintsIn: Not implemented!!';
    return state;
}

async function checkVariableConstraintsUnify (ctx, cs, env) {
    const {a, op, b, id, root} = cs;
    const av = await ctx.getVariable(a);
    const bv = await ctx.getVariable(b);

    let sa = getValue(av, ctx);
    let sb = getValue(bv, ctx);

    let state = C_UNKNOWN;
    // await debugConstraint(ctx, cs.id, state, 'UNIFY [START]');

    if (av.id === bv.id) {
        state = C_TRUE;
    }
    else if (sa !== null && sb !== null) {
        state = sa === sb? C_TRUE:C_FALSE;
    }
    else if (env.eval) {
        console.log("TODO: IF THEY ARE BOTH SET SIZE OR VARIBLES THEN CAN BE UNIFIED!")

        if (av.type === SET_SIZE && sb !== null) {
            const value = +sb;
            await ctx.setVariableValue(av.variable, {
                ...av.set,
                size: value
            });

            await ctx.setVariableValue({...av, set: undefined, value});
        }
        else if (av.type === SET_SIZE || bv.type === SET_SIZE) {
            throw 'UNIFY NOT SET FOR SET_SIZE';
        }
        if (av.type === LOCAL_VAR && bv.type === LOCAL_VAR) {
            const r = await setVariable(ctx, av, bv);
            state = r?C_TRUE:C_FALSE;
        }
        else if (av.type === LOCAL_VAR && sb !== null) {
            const c = bv.type === CONSTANT?bv:await getConstant(ctx, sb);
            const r = await setVariable(ctx, av, c);
            state = r?C_TRUE:C_FALSE;
        }
        else if (bv.type === LOCAL_VAR && sa !== null) {
            const c = bv.type === CONSTANT?av:await getConstant(ctx, sa);
            const r = await setVariable(ctx, bv, c);
            state = r?C_TRUE:C_FALSE;
        } 
    }

    if (state !== C_UNKNOWN) {
        await ctx.setVariableValue(cs.id, {
            ...cs, state
        });
        /*
        ctx.variables = await ctx.variables.set(cs.id, {
            ...cs, state
        });*/
    }

    // await debugConstraint(ctx, cs.id, state, 'UNIFY');

    return state;
}

async function setRootValue (ctx, root, value) {
    const cs = await ctx.getVariable(root.csID);

    await ctx.setVariableValue(cs.id, {
        ...cs, [`${root.side}Value`]: value, 
        state: cs.op === AND && value === C_FALSE ? C_FALSE : cs.state 
    });

    /*
    ctx.variables = await ctx.variables.set(cs.id, {
        ...cs, [`${root.side}Value`]: value, 
        state: cs.op === AND && value === C_FALSE ? C_FALSE : cs.state 
    });*/
}

async function constraintEnv (ctx, cs) {
    const r = {stop: true, eval: true, check: true};

    if (cs.root) {
        const root = await ctx.getVariable(cs.root.csID);

        if (root.op === OR) {
            const side = cs.root.side;
            const csValue = root[`${side}Value`] || root.state;
            const oValue = root[`${side === 'a' ? 'b':'a'}Value`] || root.state;
    
            if (csValue === undefined && oValue === undefined) {
                return {stop: false, eval: false, check: true};
            }
            else if (csValue === C_FALSE) {
                return {stop: false, eval: false, check: false};
            }
            else if (oValue === C_TRUE) {
                throw 'CONSTRAIN ENV : we need to get next logical root!!';
            }
            else if (oValue === C_FALSE) {
                return constraintEnv(ctx, root);
            }
            else if (csValue === C_TRUE) {
                // await debugConstraint(ctx, cs.id, C_TRUE, 'CONSTRAIN_ENV');

                /*
                    This can happen if one or side has been evaluated to true, but not the other 
                    and is still unkown.
                 */

                throw 'CONSTRAIN ENV : HOW CAN ROOT BE TRUE IF NOT ALL CONSTRAINTS AS BEEN SATISFIED!'
            }

            throw `constraintEnv: ${r.op}, csValue=${csValue}, oValue=${oValue}`; 
        }
    }

    return r;
}

async function evalConstraint (ctx, cs, env, parentConstraints) {
    if (!env.check) {
        return true;
    }

    let r;
    switch (cs.op) {
        // Set Operators,
        case IN:
            r = await checkVariableConstraintsIn(definitionDB, ctx, cs, env);
            break;

        case UNION:
            throw 'checkVariableConstraints: Union';
            break;

        // Identity Operators, 
        case UNIFY:
            r = await checkVariableConstraintsUnify(ctx, cs, env);
            break;

        case NOT_UNIFY:
            r = await checkVariableConstraintsNotUnify(ctx, cs, env);
            break;

        // Logical Operators,
        case OR:
            r = await checkOrConstrain(ctx, cs, env);
            break;

        case AND:
            r = await checkAndConstrain(ctx, cs, env);
            break;
            
        // Math Operators,
        case ADD:
        case SUB:
        case MUL:
        case DIV:
        case MOD:
            r = await checkNumberOperationsConstrain(ctx, cs, env);
            break;

        case BELOW:
        case BELOW_OR_EQUAL:
        case ABOVE:
        case ABOVE_OR_EQUAL:
            r = await checkNumberRelationConstrain(ctx, cs, env);
            break;
        
        // Function,
        case FUNCTION:
        case UNIQUE:
            r = await checkUniqueIndexConstrain(ctx, cs, env);
            break;

        default:
            throw cs.op + ' [checkVariableConstraints] NOT IMPLEMENTED!!'
    }

    // await debugConstraint(ctx, cs.id, r);

    if (r !== C_UNKNOWN) {
        // remove constraints,
        // constraints = await constraints.remove(vcID);

        if (r === C_FALSE && env.stop) {
            // await logger(ctx.options || {}, ctx, `C_FALSE && STOP ${cs}`);
            await ctx.logger(`C_FALSE && STOP ${cs}`);

            return false;
        }
        else if (r === C_FALSE) {
            // setup the root value
            await setRootValue(ctx, cs.root, r);
        }
        
        if (cs.constraints && await cs.constraints.size) {
            parentConstraints.add(cs);
        }
    }

    // await logger(ctx.options || {}, ctx, `constraints are OK - ${cs}`);

    await ctx.logger(`constraints are OK - ${cs}`);


    return true;
} 

async function checkVariableConstraints (ctx, v) {
    // let constraints = v.constraints;

    const options = ctx.options || {};

    const env = await constraintEnv(ctx, v);

    if (!env.check) {
        return true;
    }

    /*if (v.state && v.state !== C_UNKNOWN) {
        return v.state === C_TRUE?true:false;
    }*/

    const parentConstraints = new Set();

    for await (let vcID of v.constraints.values()) {
        const cs = await ctx.getVariable(vcID);
        const env = await constraintEnv(ctx, cs);

        const r = await evalConstraint(ctx, cs, env, parentConstraints);

        if (r === false) {
            return false;
        }
    }

    /*
    if (constraints.size !== v.constraints.size) {
        ctx.variables = await ctx.variables.set(v.id, {
            ...v,
            constraints: constraints.size ? constraints : null
        });
    }*/

    for (let cs of parentConstraints) {
        const r = await checkVariableConstraints(ctx, cs);

        if (r === false) {
            await ctx.logger(`Parent Constraints - Fail - ${cs}`);
            return false;
        }
    }

    return true;
}


module.exports = {
    checkVariableConstraints,
    setVariable,
    constraintEnv,
    evalConstraint
};

