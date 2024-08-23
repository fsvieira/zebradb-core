/*
const {
    varGenerator, 
    type,
    get,
    copyTerm,
    copyPartialTerm,
    toString,
    getVariable,
    getConstantVarname,
    logger,
    getContextState
} = require("./base");

const constants = require("./constants");
*/

const {
    unify, constants
} = require("./built-in/constraints.js");

/*
const {
    type: {
        CONSTANT, // : "c",
        TUPLE, // : "t",
        CONSTRAINT, // : "cs",
        SET, // : "s",
        MATERIALIZED_SET, // : "ms"
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
    }
} = constants;
*/

/*
const FN_FALSE = async () => false;

async function unifyMsMs (ctx, p, q) {
    throw 'UNIFY MS MS IS NOT DEFINED';
}

const unifyFn = {
    [LOCAL_VAR]: {
        [LOCAL_VAR]: setVariable,
        [TUPLE]: setVariable, // !p.d && await unifyVariable(ctx, p, q),
        [CONSTANT]: setVariable, // async (ctx, p, q) => (!p.d || (p.d && p.d.includes(q.id))) && await unifyVariable(ctx, p, q)
        [MATERIALIZED_SET]: setVariable
    },
    [TUPLE]: {
        [LOCAL_VAR]: async (ctx, p, q) => unifyFn[LOCAL_VAR][TUPLE](ctx, q, p),
        [TUPLE]: async (ctx, p, q) => {
            if (p.id !== q.id) {
                if (p.data.length === q.data.length) {
                    for (let i=0; i<p.data.length; i++) {
                        const r = await doUnify(ctx, p.data[i], q.data[i]);

                        if (!r) {
                            return false;
                        }
                    }

                    // await checkTuple(ctx, p, q);

                    await ctx.setVariableValue(
                        q.id, {
                            defer: p.id
                        }
                    );

                    return true;
                }
                
                return false;
            }

            return true;
        },
        [CONSTANT]: FN_FALSE,
        [MATERIALIZED_SET]: FN_FALSE
    },
    [CONSTANT]: {
        [LOCAL_VAR]: async (ctx, p, q) => unifyFn[LOCAL_VAR][CONSTANT](ctx, q, p),
        [TUPLE]: async () => false,
        [CONSTANT]: async (ctx, p, q) => p.data === q.data,
        [MATERIALIZED_SET]: FN_FALSE
    },
    [MATERIALIZED_SET]: {
        [LOCAL_VAR]: FN_FALSE,
        [TUPLE]: FN_FALSE,
        [CONSTANT]: FN_FALSE,
        [MATERIALIZED_SET]: unifyMsMs
    }
}

const doUnify = async (ctx, p, q) => {
    p = await ctx.getVariable(p);
    q = await ctx.getVariable(q);

    let s;
    
    if (ctx.options.log) {
        s = `${await ctx.toString(p.id)} ** ${await ctx.toString(q.id)}`;
    }


    // console.log(
    //     'DO UNIFY ',
    //     await toString(null, p.id, ctx), ' ** ', 
    //     await toString(null, q.id, ctx)
    // );

    const ok =  await unifyFn[p.type][q.type](ctx, p, q);

    if (ctx.options.log) {
        const ps = await ctx.toString(p.id);
        const qs = await ctx.toString(q.id);

        s += `; p=${ps}, q=${qs}`;
        if (!ok) {
            await ctx.logger(`FAIL: ${s}`);
        }
        else {
            await ctx.logger(`SUCC: ${s}`);
        }
    }

    return ok;
}

async function unify (ctx, tuple, definitionID) {
    const ok = await doUnify(
        ctx,
        tuple, 
        definitionID
    );

    ctx.state = !ok ? 'no': ctx.state;

    return ok;
}
*/

module.exports = {unify, constants };
