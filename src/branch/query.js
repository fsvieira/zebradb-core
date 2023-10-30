const branchOps = require('./branch');

const query = async (rDB, tuple, branchID, definitionsDB) => {
    // 1. create root branch,
    const resultsID = '__resultsSet';

    const queryRootBranch = await rDB.tables.branches.insert({
        branchID,
        parent: null,
        root: resultsID,
        level: 0,
        checked: rDB.iSet(),
        unchecked: rDB.iSet(),
        variables: rDB.iMap(),
        constraints: rDB.iSet(),
        unsolvedVariables: rDB.iSet(),
        children: [],
        state: 'split',
        variableCounter: 0,
        log: rDB.iArray()
    }, null);

    await branchOps.createMaterializedSet(
        rDB,
        resultsID,
        queryRootBranch,
        tuple, definitionsDB
    );

    /*
    let unchecked = rDB.iSet();
    let checked = rDB.iSet();
    let variables = rDB.iMap();
    let constraints = rDB.iSet();
    let unsolvedVariables = rDB.iSet();
    let log = rDB.iArray();

    // const {varCounter, newVar} = branchOps.varGenerator(0); 
    const level = 0;

    const resultsID = '__resultsSet';
    
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

    // Create initial branch,
    const queryRootBranch = await rDB.tables.branches.insert({
        branchID,
        parent: null,
        root: resultsID,
        level,
        checked: ctx.checked,
        unchecked: ctx.unchecked,
        variables: ctx.variables,
        constraints: ctx.constraints,
        unsolvedVariables: ctx.unsolvedVariables,
        children: [],
        state: 'split',
        variableCounter: varCounter(),
        log: ctx.log
    }, null);

    await branchOps.createMaterializedSet(
        rDB,
        resultsID,
        queryRootBranch,
        root
    );*/
}

module.exports = {branchOps, query};