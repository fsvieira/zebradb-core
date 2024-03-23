const {branchOps, query} = require('./query');
const {parse} = require('../parsing');
const {DB} = require('beastdb');
const {SHA256} = require("sha2");
const BranchContext = require('./branchContext');

class QueryEngine {

    constructor (db, options={}) {
        this.db = db;
        this.options = options;
    }

    async init (tuple) {
        try {
            const querySet = parse(tuple)[0];

            const branchID = SHA256(JSON.stringify([
                this.db.id,
                SHA256(JSON.stringify(querySet)).toString("hex")
            ])).toString("hex");

            this.rDB = await DB.open({
                storage: {
                    path: this.options.path + '-' + branchID + '.db' 
                }
            });
            
            await this.rDB.tables.branches
                .key('branchID')
                .index('parent')
                .index('level')
                .index('state')
                .index('group', 'groupState', 'state')
                .save()
            ;

            await query(this.options, this.rDB, querySet, branchID, this.db);

            return this;
        }
        catch (e) {
            console.log(e);
        }
    }

    async nextBranch () {
        const branches = this.rDB.tables.branches;

        /*
        // Solve unsolved variables first, because solutions are guaranteed. 
        for await (let branch of branches.findByIndex({state: 'unsolved_variables'})) {
            return branch;
        }*/

        for await (let branch of branches.findByIndex({state: 'maybe'})) {
            return branch;
        }
    }

    async run () {
        const selector = async branch => {
            const unchecked = await branch.data.unchecked;

            for await (let id of unchecked.values()) {
                return id;
            }
        }

        const definitions = async tuple => this.db.search(tuple);

        let branch;

        const {depth, timeout} = this.options;

        const end = timeout?new Date().getTime() + timeout:Infinity;

        const branches = this.rDB.tables.branches;

        while ((branch = await this.nextBranch()) && new Date().getTime() < end) {
            const level = await branch.data.level;

            if (!depth || (depth > level)) {
                await branchOps.expand(
                    this.db,
                    branch, 
                    this.options, 
                    selector, 
                    definitions
                );
            }
            else {
                await branch.update({state: 'stop'});
            }
        }

        console.log("TODO : merge all on result set!!");
        // TODO: make a new "queue" for success branches!!
        /*
        let mergeBranch;
        for await (let branch of branches.findByIndex({state: 'yes'})) {
            if (!mergeBranch) {
                mergeBranch = branch;
            }
            else {
                mergeBranch = await branchOps.merge(this.options, this.rDB, mergeBranch, branch);
            }
        }*/

    }

    async toJS (branch) {
        return branchOps.toJS(branch);
    }

    async toString (branch) {
        let logString = '';

        /*if (this.options.log) {
            const log = await branch.data.log;
            if (log.length > 0) {
                let s = [];

                for await (let e of log) {
                    s.push(e);
                }

                logString = JSON.stringify(s);
            }
        }

        return logString + (await branchOps.toString(branch));*/
        // return await branchOps.toString(branch);

        const ctx = await BranchContext.create(branch, this.options, this.db);
        return ctx.toString();
    }

    async getSolutions () {
        const r = [];
        const branches = this.rDB.tables.branches;

        for await (let branch of branches.findByIndex({state: 'yes'})) {
            r.push(branch);
        }

        return r;
    }

    async getFails () {
        const r = [];
        const branches = this.rDB.tables.branches;

        for await (let branch of branches.findByIndex({state: 'no'})) {
            r.push(branch);
        }

        return r;
    }
}

module.exports = QueryEngine;

