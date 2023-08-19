const {
    type: {
        CONSTANT,
        TUPLE,
        VARIABLE,
        CONSTRAINT,
        SET
    },
    operation: {
        OR,
        AND,
        IN
    }
} = require("./constants");


const varname = ({did}) => `__set_${did}`;

async function create (definition, constraints) {

    const dset = {
        type: SET,
        set: ctx.branch.rDB.iSet(),
        definition,
        constraints
    };
    
    return dset;
}

async function getSet (ctx, definition) {
    const vid = varname(definition);

    let dset = await ctx.variables.get(vid);

    if (!dset) {
        dset = await create(definition, constraints);
    }

    return dset;
}

async function inSet (ctx, x, definition) {
    const dset = await getSet(ctx, definition);

    // insert x in set, 
}


module.exports = {
    inSet
};

