
module.exports = {
    type: {
        CONSTANT: "c",
        NUMBER: 'n',
        TUPLE: "t",
        CONSTRAINT: "cs",
        SET: "s",
        SET_CS: 'sc',
        SET_EXP: 'se',
        LOCAL_VAR: 'lv',
        GLOBAL_VAR: 'gv',
        DEF_REF: 'd'
    },
    operation: {
        OR: "or",
        AND: "and",
        IN: "in",
        UNIFY: "=",
        NOT_UNIFY: "!=",
        UNION: "union",
        ADD: '+',
        SUB: '-'
    }
};

