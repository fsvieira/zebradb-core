const branchOps = require('./branch');

const query = async (options, rDB, set, branchID, definitionsDB) => {
    // 1. create root branch,
    const resultsID = '__resultsSet';

    const ctx = {log: await rDB.iArray()}; 
    const log = await branchOps.logger(
        options, 
        ctx,
        `Query Start`
    );
    
    // const log = await rDB.iArray().push(`Query Setup`);
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
        log
    }, null);

    await branchOps.createMaterializedSet(
        options,
        rDB,
        resultsID,
        queryRootBranch,
        set, 
        definitionsDB
    );

}

module.exports = {branchOps, query};