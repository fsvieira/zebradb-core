
module.exports = {
    type: {
        CONSTANT: "c",
        TUPLE: "t",
        CONSTRAINT: "cs",
        SET: "s",
        LOCAL_VAR: 'lv',
        GLOBAL_VAR: 'gv',
        DEF_REF: 'd'
    },
    operation: {
        OR: "or",
        AND: "and",
        IN: "in",
        UNIFY: "=",
        NOT_UNIFY: "!="
    }
};

