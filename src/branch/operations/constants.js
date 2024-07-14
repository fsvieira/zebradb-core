
module.exports = {
    type: {
        CONSTANT: "c",
        TUPLE: "t",
        CONSTRAINT: "cs",
        SET: "s",
        SET_EXP: 'se',
        LOCAL_VAR: 'lv',
        GLOBAL_VAR: 'gv',
        DEF_REF: 'd',
        INDEX: 'idx',
        MATERIALIZED_SET: 'ms',
        SET_SIZE: 'ss'
    },
    operation: {
        OR: "or",
        AND: "and",
        IN: "in",
        UNIFY: "=",
        NOT_UNIFY: "!=",
        UNION: "union",
        ADD: '+',
        SUB: '-',
        MUL: '*',
        DIV: '/',
        MOD: '%',
        FUNCTION: 'fn',
        BELOW: '<',
        BELOW_OR_EQUAL: '<=',
        ABOVE: '>',
        ABOVE_OR_EQUAL: '>=',
        UNIQUE: 'un',
        SUBSET: 'subset'
    },
    values: {
        C_FALSE: 1,
        C_TRUE: 2,
        C_UNKNOWN: 3
    }
};

