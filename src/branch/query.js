const branchOps = require('./branch');

const { BranchContext } = branchOps;

const query = async (qe, definitionElement) => {

    // 1. create root branch,
    const resultsID = '__resultsSet';

    const options = qe.options;
    const rDB = qe.rDB;
    const definitionsDB = this.db;

    /*
    create (
        branch, 
        branchDB,
        options, 
        definitionDB, 
        rDB=branch?.table.db, 
        ctx={}
    )*/

    const rootCtx = await BranchContext.create(
        null, 
        qe.branchDB, 
        qe.options, 
        qe.db, 
        qe.rDB, 
        {branchID: 'ROOT'}
    );


    // const root = await this.branchDB.createBranch(null, 'ROOT');

    const {root: rootElement} = definitionElement;
        const setID = await branchOps.copyPartialTerm(
            rootCtx, 
            definitionElement, 
            rootElement,
            true, // extendSets,
            true
    );

    await rootCtx.setVariableValue(resultsID, {
        type: branchOps.constants.type.LOCAL_VAR, 
        defer: setID, 
        id: resultsID
    });
    

    // variables = variables.set(resultsID, )

    /* const state = {
        variables
    }*/

    // await this.branchDB.commit(root, {state});

    /*
    const ctx = {log: await rDB.iArray()}; 
    const log = await branchOps.logger(
        options, 
        ctx,
        `Query Start`
    );*/

    /*
    let actions = rDB.iArray();
    actions = await actions.push({action: 'init-set', setID: resultsID, set});

    const ctx = await BranchContext.create(
        null, options, definitionsDB, 
        rDB, 
        {
            branchID,
            version: 1,
            // state: 'maybe',
            // root: resultsID,
            actions
        }
    );

    await ctx.logger(`Query Start`);
    
    const queryRootBranch = await ctx.saveBranch();
    */

    /*await branchOps.createBranchMaterializedSet(
        options,
        rDB,
        resultsID,
        queryRootBranch,
        set, 
        definitionsDB,
        true
    );*/

}

module.exports = {branchOps, query};