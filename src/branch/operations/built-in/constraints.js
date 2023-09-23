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

/*
function getValue (v) {
    if (v.type === CONSTRAINT && v.state === C_TRUE) {
        return v.value;
    }
    else if (v.type === CONSTANT) {
        return v.data;
    }

    return null
}*/

function getNumber (v) {
    const n = getValue(v);

    if (n !== null) {
        return parseFloat(n);
    }

    return n;
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
                ...cs, state, value: state === C_FALSE?0:1
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
        ...cs, state: C_TRUE, value: r
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

    if (av.id === bv.id) {
        return C_TRUE;
    }

    const sa = getValue(av);
    const sb = getValue(bv);

    if (sa !== null && sb !== null) {
        if (sa !== sb) {
            ctx.variables = await ctx.variables.set(cs.id, {
                ...cs, state: C_FALSE
            });

            return C_FALSE;
        }

        // should be a value id ? 
        ctx.variables = await ctx.variables.set(cs.id, {
            ...cs, state: C_TRUE, value: sa
        });
    }

    return C_UNKNOWN;
}

async function checkVariableConstrains (ctx, v) {
    let constraints = v.constraints;

    if (v.state) {
        console.log(v);
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
            constraints = await constraints.remove(vcID);

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

    if (constraints.size !== v.constraints.size) {
        ctx.variables = await ctx.variables.set(v.id, {
            ...v,
            constraints: constraints.size ? constraints : null
        });
    }

    for (let cs of parentConstraints) {
        const r = await checkVariableConstrains(ctx, cs);

        if (r === false) {
            return false;
        }
    }
    
    return true;
}


module.exports = {
    checkVariableConstrains
};

