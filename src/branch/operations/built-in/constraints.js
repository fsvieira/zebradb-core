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
        FUNCTION 
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
        return parseFloat(n);
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


async function checkNumberConstrain(ctx, cs) {
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
    else if (
        (op === OR || op === AND) 
        &&
        (an < 0 || an > 1 || bn < 0 || bn > 1)
    ) {
        state = C_FALSE;
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
        case OR:
            r = an || bn;
            break;

        case AND:
            r = an && bn;
            break;

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
   }

   ctx.variables = await ctx.variables.set(cs.id, {
        ...cs, state: C_TRUE, value: r.toString()
   });

   return C_TRUE;
}

async function checkVariableConstrainsNotUnify (ctx, cs) {
    throw cs;
}


async function checkVariableConstrainsUnify (ctx, cs) {
    const {a, op, b, id} = cs;
    const av = await getVariable(null, a, ctx);
    const bv = await getVariable(null, b, ctx);

    const sa = getValue(av);
    const sb = getValue(bv);

    let state = C_UNKNOWN;

    if (av.id === bv.id) {
        state = C_TRUE;
    }
    else if (av.type === LOCAL_VAR && bv.type === LOCAL_VAR) {
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
    else if (sa !== null && sb !== null) {
        state = sa === sb? C_TRUE:C_FALSE;
    }

    if (state) {
        ctx.variables = await ctx.variables.set(cs.id, {
            ...cs, state, value: (state === C_TRUE?1:0).toString()
        });

    }

    return state;
}

async function checkVariableConstrains (ctx, v) {
    // let constraints = v.constraints;

    if (v.state) {
        return v.state === C_TRUE?1:0;
        // throw 'checkVariableConstrains: Variable State : ' + v.state + ' is not handled!!';
    }

    const parentConstraints = new Set();

    for await (let vcID of v.constraints.values()) {
        const cs = await getVariable(null, vcID, ctx);

        let r;
        switch (cs.op) {
            // Set Operators,
            case IN:
            case UNION:
                throw 'checkVariableConstrains: In / Union';
                break;

            // Identity Operators, 
            case UNIFY:
                r = await checkVariableConstrainsUnify(ctx, cs);
                break;

            case NOT_UNIFY:
                r = await checkVariableConstrainsNotUnify(ctx, cs);
                break;

            // Logical Operators,
            case OR:
            case AND:
                
            // Math Operators,
            case ADD:
            case SUB:
            case MUL:
            case DIV:
            case MOD:
                r = await checkNumberConstrain(ctx, cs);
                break;
            
            // Function,
            case FUNCTION:
        }

        if (r !== C_UNKNOWN) {
            // remove constraints,
            // constraints = await constraints.remove(vcID);

            // check parent constraints,
            if (cs.constraints && cs.constraints.size) {
                parentConstraints.add(cs);
            }
            else if (r === C_FALSE) {
                // there is no parent constraints, so it should fail
                return false;
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

