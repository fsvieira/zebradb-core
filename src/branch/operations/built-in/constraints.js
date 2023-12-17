const constants = require("../constants");
const {
    varGenerator, 
    type,
    get,
    copyTerm,
    copyPartialTerm,
    toString,
    getVariable,
    getConstantVarname
} = require("../base");

const {
    type: {
        CONSTANT, // : "c",
        TUPLE, // : "t",
        CONSTRAINT, // : "cs",
        SET, // : "s",
        SET_CS, // : sc
        LOCAL_VAR, // : 'lv',
        GLOBAL_VAR, // : 'gv',
        DEF_REF, // d
        MATERIALIZED_SET // ms
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
    }
} = constants;

const C_FALSE = 1;
const C_TRUE = 2;
const C_UNKNOWN = 3;

/*
    Set Variable
*/
async function intersectDomains(ctx, a, b) {
    if (a.domain && b.domain) {

        if (a.domain === b.domain) {
            return a.domain;
        }
        else {
            const domainA = await getVariable(null, a.domain, ctx); 
            const domainB = await getVariable(null, b.domain, ctx); 

            if (domainA.type === SET && domainB.type === SET) {
                const elements = domainA.elements.filter(v => domainB.elements.includes(v));
                
                if (elements.length === 0) {
                    return null;
                }

                const id = ctx.newVar();
                const s = {
                    type: SET,
                    elements,
                    id,
                    size: elements.length
                };

                ctx.variables = await ctx.variables.set(id, s);

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
        const d = await getVariable(null, v.domain, ctx);
        
        switch (d.type) {
            case SET:
                if (!d.elements.includes(c.id)) {
                    return false;
                }

                break;

            default:
                throw `setVariableLocalVarConstant Domain ${d.type} not defined!`;
        }
    }

    ctx.variables = await ctx.variables.set(v.id, {...v, defer: c.id});

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
        const d = await getVariable(null, v.domain, ctx);

        console.log(
            await toString(null, d.id, ctx), 
            await toString(null, t.id, ctx),
            await toString(null, v.id, ctx)
        );

        throw `setVariableLocalVarTuple Domain ${d.type} not defined!`;
    }

    ctx.variables = await ctx.variables.set(v.id, {...v, defer: t.id});

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
        ctx.variables = await ctx.variables.set(a.id, {
            ...a,
            domain: aDomain || a.domain,
            constraints: aConstraints || a.constraints
        });
    }

    ctx.variables = await ctx.variables.set(b.id, {...b, defer: a.id});

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

    if (!(await ctx.variables.has(vID))) {
        const c = {
            type: CONSTANT,
            data: string,
            id: vID
        };

        ctx.variables = await ctx.variables.set(vID, c);

        return c;
    }

    return await ctx.variables.get(vID);
}

async function checkNumberRelationConstrain(ctx, cs, env) {
    const {a, op, b, id} = cs;
    const av = await getVariable(null, a, ctx);
    const bv = await getVariable(null, b, ctx);

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
            ctx.variables = await ctx.variables.set(cs.id, {
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

   ctx.variables = await ctx.variables.set(cs.id, {
        ...cs, state
   });

   return state;
}

async function checkNumberOperationsConstrain(ctx, cs, env) {
    const {a, op, b, id} = cs;
    const av = await getVariable(null, a, ctx);
    const bv = await getVariable(null, b, ctx);

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
            ctx.variables = await ctx.variables.set(cs.id, {
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
   
   ctx.variables = await ctx.variables.set(cs.id, {
        ...cs, state, value: r.toString()
   });

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
    const av = await getVariable(null, a, ctx);
    const bv = await getVariable(null, b, ctx);

    const sa = getValue(av);
    const sb = getValue(bv);

    let state = C_UNKNOWN;

    if (av.id === bv.id) {
        state = C_FALSE;
    }
    else if (sa !== null && sb !== null) {
        state = sa !== sb ? C_TRUE : C_FALSE;
    }
    else if (sa !== null && bv.domain) {
        state = await excludeFromDomain(ctx, av, bv, cs);
    }
    else if (sb !== null && av.domain) {
        state = await excludeFromDomain(ctx, bv, av, cs);
    }

    if (state !== C_UNKNOWN) {
        ctx.variables = await ctx.variables.set(cs.id, {
            ...cs, state
        });
    }

    return state;

}

async function checkAndConstrain (ctx, cs, env) {
    const {a, op, b, id} = cs;
    const av = await getVariable(null, a, ctx);
    const bv = await getVariable(null, b, ctx);

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
        ctx.variables = await ctx.variables.set(cs.id, {
            ...cs, state, aValue: sa
        });
    }
    else if (sb !== C_UNKNOWN) {
        ctx.variables = await ctx.variables.set(cs.id, {
            ...cs, state, bValue: sb
        });
    }
    
    if (state !== C_UNKNOWN) {
        ctx.variables = await ctx.variables.set(cs.id, {
            ...cs, state,
            aValue: sa, bValue: sb
        });
    }

    // await debugConstraint(ctx, cs.id, state, 'AND');

    return state;
}

async function checkOrConstrain (ctx, cs) {
    const {a, op, b, id} = cs;
    const av = await getVariable(null, a, ctx);
    const bv = await getVariable(null, b, ctx);

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
        ctx.variables = await ctx.variables.set(cs.id, {
            ...cs, state, aValue: sa
        });
    }
    else if (sb !== C_UNKNOWN) {
        ctx.variables = await ctx.variables.set(cs.id, {
            ...cs, state, bValue: sb
        });
    }

    if (state !== C_UNKNOWN) {
        ctx.variables = await ctx.variables.set(cs.id, {
            ...cs, state
        });
    }

    return state;
}

async function checkVariableConstraintsIn (ctx, cs, env) {
    const {a, op, b, id, root} = cs;
    const av = await getVariable(null, a, ctx);
    const bv = await getVariable(null, b, ctx);

    const sa = getValue(av);
    const sb = getValue(bv);

    console.log(a, b, id, root, sa, sb);

    let state = C_UNKNOWN;

    //1. check if element is already on set. 
    console.log(av, bv, JSON.stringify(bv.definition, null, '  '));

    if (bv.type === MATERIALIZED_SET) {
        const {definition: {variables, root}} = bv;

        const rootEl = variables[root];
        if (rootEl.type === SET_CS) {
            const elementDef = variables[rootEl.element];

            console.log("COPY EL", elementDef);
            throw 'checkVariableConstraintsIn : Copy Element!! // SHOULD INDEXES BE ON TUPLE OR SET ??';
        }
        else {
            throw `checkVariableConstraintsIn : Check def Type ${rootEl.type} Not implemented`;
        }
    }
    else {
        throw `checkVariableConstraintsIn : Type ${bv.type} Not implemented`;
    }

    console.log("TODO: CHECK IF ELEMENT IS ALREADY ON SET.");
    if (env.eval) {
        const bElement = bv.definition
        const elementDef = bv.definition[root]
    }

    throw 'checkVariableConstraintsIn: Not implemented!!';
    return state;
}

async function checkVariableConstraintsUnify (ctx, cs, env) {
    const {a, op, b, id, root} = cs;
    const av = await getVariable(null, a, ctx);
    const bv = await getVariable(null, b, ctx);

    const sa = getValue(av);
    const sb = getValue(bv);

    let state = C_UNKNOWN;
    // await debugConstraint(ctx, cs.id, state, 'UNIFY [START]');

    if (av.id === bv.id) {
        state = C_TRUE;
    }
    else if (sa !== null && sb !== null) {
        state = sa === sb? C_TRUE:C_FALSE;
    }
    else if (env.eval) {

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
        ctx.variables = await ctx.variables.set(cs.id, {
            ...cs, state
        });
    }

    // await debugConstraint(ctx, cs.id, state, 'UNIFY');

    return state;
}

async function setRootValue (ctx, root, value) {
    const cs = await getVariable(null, root.csID, ctx);

    ctx.variables = await ctx.variables.set(cs.id, {
        ...cs, [`${root.side}Value`]: value
    });
}

async function constraintEnv (ctx, cs) {
    const r = {stop: true, eval: true, check: true};

    if (cs.root) {
        const root = await getVariable(null, cs.root.csID, ctx);

        if (root.op === OR) {

            const side = cs.root.side;
            const csValue = root[`${side}Value`]
            const oValue = root[`${side === 'a' ? 'b':'a'}Value`];

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

async function debugConstraint (ctx, id, result, str='') {
    
    // DEBUG
    const s = await toString(null, id, ctx);
    const values = ['', 'FALSE', 'TRUE', 'UNKNOWN'];
    console.log(`DEBUG ${str}:`, s, " ==> " , values[result]);
}

async function checkVariableConstraints (ctx, v) {
    // let constraints = v.constraints;

    const env = await constraintEnv(ctx, v);

    if (!env.check) {
        return true;
    }

    /*if (v.state && v.state !== C_UNKNOWN) {
        return v.state === C_TRUE?true:false;
    }*/

    const parentConstraints = new Set();

    for await (let vcID of v.constraints.values()) {
        const cs = await getVariable(null, vcID, ctx);

        const env = await constraintEnv(ctx, cs);

        if (!env.check) {
            continue;
        }

        let r;
        switch (cs.op) {
            // Set Operators,
            case IN:
                console.log(cs);
                r = await checkVariableConstraintsIn(ctx, cs, env);
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
            default:
                throw cs.op + ' [checkVariableConstraints] NOT IMPLEMENTED!!'
        }

        // await debugConstraint(ctx, cs.id, r);

        if (r !== C_UNKNOWN) {
            // remove constraints,
            // constraints = await constraints.remove(vcID);

            if (r === C_FALSE && env.stop) {
                return false;
            }
            else if (r === C_FALSE) {
                // setup the root value
                await setRootValue(ctx, cs.root, r);
            }
            else if (cs.constraints && cs.constraints.size) {
                parentConstraints.add(cs);
            }
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
            return false;
        }
    }

    return true;
}


module.exports = {
    checkVariableConstraints,
    setVariable
};

