const branchOps = require('./branch');

const query = async (rDB, tuple, branchID, definitionsDB) => {    
    let unchecked = rDB.iSet();
    let checked = rDB.iSet();
    let variables = rDB.iMap();
    let constraints = rDB.iSet();
    let unsolvedVariables = rDB.iSet();
    let log = rDB.iArray();

    const {varCounter, newVar} = branchOps.varGenerator(0); 
    const level = 0;

    const ctx = {
        newVar,
        unchecked,
        checked,
        variables,
        unsolvedVariables,
        level,
        rDB,
        log,
        constraints
    };

    const root = await branchOps.copyTerm(ctx, tuple, definitionsDB, true);

    return branchOps.create(
        rDB, 
        root,
        varCounter(),
        level, 
        null, 
        ctx.unchecked,
        ctx.variables,
        ctx.constraints,
        ctx.unsolvedVariables,
        ctx.checked,
        branchID,
        ctx.log
    );
}

module.exports = {branchOps, query};