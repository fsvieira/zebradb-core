const { v4: uuidv4 } = require('uuid');

class BranchDB {
    constructor (rDB) {
        this.rDB = rDB;
    }

    async init () {
        await  this.createTables();
        return this;
    }

    async createTables () {
        await this.rDB.tables.commits
            .key('commitID')
            .index('parentCommit')
            .save();

        await this.rDB.tables.branches
            .key('branchID')
            .index('head')
            .save();
    }

    async createBranch (parentBranch=null, branchID=uuidv4()) {
        let commit = parentBranch ? await parentBranch.data.head : null;

        const branch = await this.rDB.tables.branches.insert({
            branchID,
            head: commit
        }, null);

        return branch
    }
    
    async commit (branch, changes) {
        const head = await branch.data.head;
        const commit = await this.rDB.tables.commits.insert({
            commitID: uuidv4(),
            parentCommit: head,
            ...changes
        }, null);

        await branch.update({
            head: commit
        });

        return commit;
    }

    async merge (branchA, branchB) {
        // TODO: three-way merge ? or we dont want a merge but instead idenpent operations.
        const headA = await branchA.data.head;
        const headB = await branchB.data.head;
        
        const aCommitID = await headA.data.commitID;
        let bCommit = headB;
        let bCommitID = await bCommit.data.commitID;
        
        while (aCommitID !== bCommitID) {
            bCommit = await bCommit.data.parentCommit;
            bCommitID = await bCommit.data.commitID;
        };

        if (aCommitID === bCommitID) {
            return await branchA.update({head: headB});
        }
        else {
            throw 'Branch Conflict Not Implemented!';
        }

    }
}

/*
async function main () {
    const db = new BranchDB();
    await db.init();
    
    const root = await db.createBranch();

    {
        const variables = await db.rDB.iMap().set('a', 0).set('b', 0); 
        await db.commit(root, {data: {
            variables
        }});
    }
    
    {
        const a = await db.createBranch(root);
        const data = await a.data.data;

        data.variables = await data.variables.set('a', 1);
        data.changes = ['a'];
        await db.commit(a, {data});
    }

    {
        const b = await db.createBranch(root);
        const data = await b.data.data;

        data.variables = await data.variables.set('b', 2);
        data.changes = ['b'];
        await db.commit(b, {data});
    }

    await db.merge(root, a);
    await db.merge(root, b);

}*/

module.exports = BranchDB;

