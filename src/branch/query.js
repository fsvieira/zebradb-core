const branchOps = require('./branch');

const query = async (rDB, tuple, branchID) => {    
    let unchecked = rDB.iSet();
    let variables = rDB.iMap();
    let constrains = rDB.iSet();
    let unsolvedVariables = rDB.iSet();
    let log = rDB.iArray();

    const {varCounter, newVar} = branchOps.varGenerator(0); 
    const level = 0;

    const ctx = {
        newVar,
        unchecked,
        variables,
        unsolvedVariables,
        level,
        rDB,
        definitionVariables: branchOps.prepareVariables(tuple),
        log,
        constrains
    };

    const root = await branchOps.copyTerm(ctx, tuple, 1);

    return branchOps.create(
        rDB, 
        root,
        varCounter(),
        level, 
        null, 
        ctx.unchecked,
        ctx.variables,
        ctx.constrains,
        ctx.unsolvedVariables,
        undefined,
        branchID,
        ctx.log
    );
}

module.exports = {branchOps, query};