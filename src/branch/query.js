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

}

module.exports = {branchOps, query};