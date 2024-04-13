const branchOps = require('./branch');

const { BranchContext } = branchOps;

const query = async (options, rDB, set, branchID, definitionsDB) => {
    // 1. create root branch,
    const resultsID = '__resultsSet';

    /*
    const ctx = {log: await rDB.iArray()}; 
    const log = await branchOps.logger(
        options, 
        ctx,
        `Query Start`
    );*/

    const ctx = await BranchContext.create(
        null, options, definitionsDB, 
        rDB, 
        {
            branchID,
            state: 'split',
            root: resultsID
        }
    );

    await ctx.logger(`Query Start`);
    
    const queryRootBranch = await ctx.saveBranch();
    
    await branchOps.createBranchMaterializedSet(
        options,
        rDB,
        resultsID,
        queryRootBranch,
        set, 
        definitionsDB,
        true
    );

}

module.exports = {branchOps, query};