const {branchOps, query} = require('./query');
const {parse} = require('../parsing');
const {DB} = require('beastdb');
const {SHA256} = require("sha2");
const BranchContext = require('./branchContext');
const BranchDB = require("./branchDB");

class QueryEngine {

    constructor (db, options={}) {
        this.db = db;
        this.options = options;
    }

    async init (tuple) {
        try {
            const querySet = parse(tuple)[0];

            const dbID = SHA256(JSON.stringify([
                this.db.id,
                SHA256(JSON.stringify(querySet)).toString("hex")
            ])).toString("hex");

            this.rDB = await DB.open({
                storage: {
                    path: this.options.path + '-' + dbID + '.db' 
                }
            });
            
            this.branchDB = new BranchDB(this.rDB);
            await this.branchDB.init();

            /*await this.rDB.tables.branches
                .key('branchID')
                .index('parent')
                .index('level')
                .index('state')
                .index('group', 'groupState', 'state')
                .save()
            ;*/
            /*
            await this.rDB.tables.branches
                .key('branchID')
                .versions('versions')
                .save();

            await this.rDB.tables.versions
                .key('versionID')
                .index('branchID')
                // .index('state')
                // .index('group', 'state')
                .save()
            ;

            await this.rDB.tables.groups
                .key('groupID')
                .index('groupID, state')
                .index('state')
                // originalBranch, resultBranch, elementID
                .save()
            ;*/

            // await query(this.options, this.rDB, querySet, branchID, this.db);
            await query(this, querySet);

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

        const merge = [];
        for await (let branch of branches.findByIndex({state: 'merge'})) {
            merge.push(branch);
            if (merge.length === 2) {
                return {type: 'merge', merge};
            }
        }

        for await (let branch of branches.findByIndex({state: 'maybe'})) {
            return {type: 'maybe', branch};
        }

        if (merge.length === 1) {
            // await merge[0].update({state: 'yes'});
            return {type: 'gen-sets', branch: merge[0]};
        }
    }

    async run () {
        return await branchOps.run(
            this
        );
    }

    async _run () {
        const selector = async branch => {
            const unchecked = await branch.data.unchecked;

            for await (let id of unchecked.values()) {
                return id;
            }
        }

        const definitions = async tuple => this.db.search(tuple);

        // let branch;

        const {depth, timeout} = this.options;

        const end = timeout?new Date().getTime() + timeout:Infinity;

        // const branches = this.rDB.tables.branches;

        let b;
        while ((b = await this.nextBranch()) && new Date().getTime() < end) {
            const {type, ...args} = b;

            if (type === 'merge') {
                // throw 'Merge Branches ' + branch.map(b => b.id).join(", ");
                await branchOps.merge(this.options, this.rDB, ...args.merge);
            }
            else if (type === 'maybe') {
                const branch = args.branch;
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
            else if (type === 'gen-sets') {
                await branchOps.genSets(this.options, this.rDB, args.branch);
            }
        }
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

