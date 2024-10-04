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
            .index('state')
            .save();

        await this.rDB.tables.branches
            .key('branchID')
            .index('head')
            .index('state')
            .index('branchID', 'state')
            .index('groupID', 'state')
            .save();
    }

    async createBranch (groupID, parentBranch=null, branchID=uuidv4()) {
        let commit = parentBranch ? await parentBranch.data.head : null;

        const branch = await this.rDB.tables.branches.insert({
            branchID,
            groupID,
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

        const state = await commit.data.state;

        const b = await branch.snapshot();
        b.data.head = commit;
        b.data.state = state;

        try {
            await b.update();
        }
        catch (e) {
            console.log(e);
            process.exit();
        }

        /*
        const state = await commit.data.state;
        await branch.update({
            head: commit,
            state
        });*/


        return commit;
    }
}

module.exports = BranchDB;

