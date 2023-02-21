const branchOps = require('./branch');

const query = async (rDB, tuple, branchID) => {    
    let unchecked = rDB.iSet();
    let variables = rDB.iMap();
    let unsolvedVariables = rDB.iSet();

    const {varCounter, newVar} = branchOps.varGenerator(0); 
    const level = 0;

    const ctx = {
        newVar,
        unchecked,
        variables,
        unsolvedVariables,
        level,
        rDB,
        definitionVariables: branchOps.prepareVariables(tuple)
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
        ctx.unsolvedVariables,
        undefined,
        branchID
    );
}

module.exports = {branchOps, query};