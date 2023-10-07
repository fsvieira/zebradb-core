const constants = require("../constants");
const {
    varGenerator, 
    type,
    get,
    copyTerm,
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
        LOCAL_VAR, // : 'lv',
        GLOBAL_VAR, // : 'gv',
        DEF_REF // d
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
            throw 'Domain A x B';
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
        const r = await checkVariableConstrains(ctx, v);

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

    console.log("TODO: check if domain is empty, it should fail!!");

    const aDomain = (domain && a.domain !== domain)?domain:null;

    let aConstraints;
    if (b.constraints) {
        if (!a.constraints) {
            aConstraints = b.constraints;
        }
        else {
            throw 'A AND B has constraints!!';
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

        if (p.constraints || v.constraints) {
            console.log("TODO : CHECK setVariable with constrains on both vars!!");
        }

        if (v.type === LOCAL_VAR && p.type === LOCAL_VAR) {
            return await setVariableLocalVarLocalVar(ctx, v, p);
        }
        else if (v.type === LOCAL_VAR && p.type === CONSTANT) {
            return await setVariableLocalVarConstant(ctx, v, p);
        }
        else {
            throw `Set Variable ${v.type} x ${p.type} not implemented`
        }

    }
    
    return true; 
}

function getValue (v) {
    if (v.type === CONSTANT) {
        return v.data;
    }
    else if (v.type === CONSTRAINT && v.state) {
        if (v.value !== undefined) {
            return v.value;
        }

        return v.state.C_TRUE?1:0;
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


async function checkNumberConstrain(ctx, cs, env) {
    const {a, op, b, id} = cs;
    const av = await getVariable(null, a, ctx);
    const bv = await getVariable(null, b, ctx);

    const an = getNumber(av);
    const bn = getNumber(bv);

    let state;
    if (isNaN(an) || isNaN(bn)) {    
        state = C_FALSE;
    }
    /*else if ([OR, AND].includes(op)) {
        if (an !== null && bn !== null) {
            const r = an || bn;
        }
        else if (an !== null) {
            if (an === 1) {

            }
            else {

            }         

        }
        else if (bn !== null) {

        }

        return C_UNKNOWN;

    }*/
    else if (an === null || bn === null) {
        state = C_UNKNOWN;
    }

    if (state !== undefined) {
        if (state !== C_UNKNOWN) {
            ctx.variables = await ctx.variables.set(cs.id, {
                ...cs, state, value: (state === C_FALSE?0:1).toString()
            });
        }

        return state;
    }

    let r;
    switch (op) {
        /*case OR:
            throw 'OR OP IS NOT DEFINED!'
            r = an || bn;
            break;

        case AND:
            r = an && bn;
            break;*/

        // Math Operators,
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
        
        case BELOW:
            r = an < bn?1:0;
            break;

        case BELOW_OR_EQUAL:
            r = an <= bn?1:0;
            break;

        case ABOVE:
            r = an > bn?1:0;
            break;

        case ABOVE_OR_EQUAL:
            r = an >= bn?1:0;
            break;
   }

   console.log('----- (', op,') ------------->', r, '=' , an, op, bn);

   ctx.variables = await ctx.variables.set(cs.id, {
        ...cs, state: C_TRUE, value: r.toString()
   });

   return C_TRUE;
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

                // 2. remove a constrains,
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

async function checkVariableConstrainsNotUnify (ctx, cs) {
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

    // console.log(`${sa} != ${sb} => ${state}`);


    if (state !== C_UNKNOWN) {
        ctx.variables = await ctx.variables.set(cs.id, {
            ...cs, state, value: (state === C_TRUE?1:0).toString()
        });
    }

    return state;

}

async function checkAndConstrain (ctx, cs, env) {
    const {a, op, b, id} = cs;
    const av = await getVariable(null, a, ctx);
    const bv = await getVariable(null, b, ctx);

    const sa = getNumber(av);
    const sb = getNumber(bv);

    let state = C_UNKNOWN;

    if (sa === 0 || sb === 0) {
        state = C_FALSE;
    }
    else if (sa === 1 && sb === 1) {
        state = C_TRUE;
    }

    if (state !== C_UNKNOWN) {
        ctx.variables = await ctx.variables.set(cs.id, {
            ...cs, state, value: (state === C_TRUE?1:0).toString()
        });
    }

    return state;
}

async function checkOrConstrain (ctx, cs) {
    const {a, op, b, id} = cs;
    const av = await getVariable(null, a, ctx);
    const bv = await getVariable(null, b, ctx);

    const sa = getNumber(av);
    const sb = getNumber(bv);

    let state = C_UNKNOWN;

    if (sa === 1 || sb === 1) {
        state = C_TRUE;
    }
    else if (sa === 0 && sb === 0) {
        state = C_FALSE;
    }
    else if (sa !== null) {
        ctx.variables = await ctx.variables.set(cs.id, {
            ...cs, state, aValue: sa
        });
    }
    else if (sb !== null) {
        ctx.variables = await ctx.variables.set(cs.id, {
            ...cs, state, bValue: sb
        });
    }

    if (state !== C_UNKNOWN) {
        ctx.variables = await ctx.variables.set(cs.id, {
            ...cs, state, value: (state === C_TRUE?1:0).toString()
        });
    }

    return state;
}

async function checkVariableConstrainsUnify (ctx, cs, env) {
    const {a, op, b, id, root} = cs;
    const av = await getVariable(null, a, ctx);
    const bv = await getVariable(null, b, ctx);

    const sa = getValue(av);
    const sb = getValue(bv);

    let state = C_UNKNOWN;

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

        /*
        const r = await getVariable(null, root, ctx);

        if (r.op === AND) {
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
        }*/
    }

    if (state !== C_UNKNOWN) {
        ctx.variables = await ctx.variables.set(cs.id, {
            ...cs, state, value: (state === C_TRUE?1:0).toString()
        });
    }

    return state;
}

async function constraintEnv (ctx, cs) {
    const r = {stop: true, eval: true, check: true};

    if (cs.root) {
        const root = await getVariable(null, cs.root.csID, ctx);

        if (!cs.side) {
            throw 'THERE IS NO SIDE!!';
        }

        if (root.op === OR) {

            const csValue = root[`${cs.side}Value`]
            const oValue = root[`${cs.side === 'a' ? 'b':'a'}Value`];

            if (csValue === undefined && oValue === undefined) {
                return {stop: false, eval: false, check: true};
            }
            else if (csValue === 0) {
                return {stop: false, eval: false, check: false};
            }
            else if (oValue === 1) {
                throw 'CONSTRAIN ENV : we need to get next logical root!!';
            }

            throw `constraintEnv: ${r.op}, csValue=${csValue}, oValue=${oValue}`; 
        }
    }

    return r;
}

async function checkVariableConstrains (ctx, v) {
    // let constraints = v.constraints;


    const env = await constraintEnv(ctx, v);

    if (!env.check) {
        return true;
    }

    if (v.state) {
        return v.state === C_TRUE?true:false;
        // throw 'checkVariableConstrains: Variable State : ' + v.state + ' is not handled!!';
    }

    const parentConstraints = new Set();

    for await (let vcID of v.constraints.values()) {
        const cs = await getVariable(null, vcID, ctx);

        /*
        if (cs.root) {
            const r = await getVariable(null, cs.root.csID, ctx);

            if (r.op === OR && r[`${r.side}Value`] === C_FALSE) {
                return true;
            }
        }*/

        const env = await constraintEnv(ctx, cs);

        if (!env.check) {
            return true;
        }

        let r;
        switch (cs.op) {
            // Set Operators,
            case IN:
            case UNION:
                throw 'checkVariableConstrains: In / Union';
                break;

            // Identity Operators, 
            case UNIFY:
                r = await checkVariableConstrainsUnify(ctx, cs, env);
                break;

            case NOT_UNIFY:
                r = await checkVariableConstrainsNotUnify(ctx, cs, env);
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
            case BELOW:
            case BELOW_OR_EQUAL:
            case ABOVE:
            case ABOVE_OR_EQUAL:
                r = await checkNumberConstrain(ctx, cs, env);
                break;
            
            // Function,
            case FUNCTION:
            default:
                throw cs.op + ' [checkVariableConstrains] NOT IMPLEMENTED!!'
        }

        if (r !== C_UNKNOWN) {
            // remove constraints,
            // constraints = await constraints.remove(vcID);

            if (r === C_FALSE && env.stop) {
                return false;

            // check parent constraints,
            /* if (r === C_FALSE) {
                // there is no parent constraints, so it should fail

                if (cs.root) {
                    const {a, op, b} = await getVariable(null, cs.root, ctx);

                    if (op === OR) {
            
                        throw 'HANDLE OR-FALSE!!';
                    }
                }

                return false;
            }*/
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
        const r = await checkVariableConstrains(ctx, cs);

        if (r === false) {
            return false;
        }
    }

    return true;
}


module.exports = {
    checkVariableConstrains,
    setVariable
};

