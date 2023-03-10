const {branchOps, query} = require('./query');
const {parse} = require('../parsing');
const {DB} = require('beastdb');
const {SHA256} = require("sha2");

class QueryEngine {

    constructor (db, options={}) {
        this.db = db;
        this.options = options;
    }

    async init (tuple) {
        try {
            const queryTuple = parse(tuple)[0];

            const branchID = SHA256(JSON.stringify([
                this.db.id,
                SHA256(JSON.stringify(queryTuple)).toString("hex")
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
                .save()
            ;

            await query(this.rDB, queryTuple, branchID);

            return this;
        }
        catch (e) {
            console.log(e);
        }
    }

    async nextBranch () {
        const branches = this.rDB.tables.branches;

        // Solve unsolved variables first, because solutions are guaranteed. 
        for await (let branch of branches.findByIndex({state: 'unsolved_variables'})) {
            return branch;
        }

        for await (let branch of branches.findByIndex({state: 'maybe'})) {
            return branch;
        }
    }

    async run () {
        const selector = async branch => {
            const cache = {};


            const tupleVars = async (id) => {
                let count = cache[id];

                if (count !== undefined) {
                    return count;
                }   
                else {
                    const v = await branchOps.getVariable(branch, id);
                    count = 0;

                    if (v.v) {
                        count += 1;
                    }
                    else if (v.t) {
                        cache[id] = 0;
                        for (let i=0; i<v.t.length; i++) {
                            count += await tupleVars(v.t[i]);
                        }
                    }
                }

                cache[id] = count;
                return count;
            }


            const unchecked = await branch.data.unchecked;
            // let index = Math.round((unchecked.size - 1) * Math.random());


            let t, max;
            for await (let id of unchecked.values()) {
                const m = tupleVars(id);
                if (!max || m > max) {
                    max = m;
                    t = id;
                }
            }

            return t;
        }

        const definitions = async tuple => this.db.search(tuple);

        let branch;

        const {depth, timeout} = this.options;

        const end = timeout?new Date().getTime() + timeout:Infinity;

        while ((branch = await this.nextBranch()) && new Date().getTime() < end) {
            const level = await branch.data.level;

            if (!depth || (depth > level)) {
                await branchOps.expand(branch, this.options, selector, definitions);
            }
            else {
                await branch.update({state: 'stop'});
            }
        }
    }

    async toJS (branch) {
        return branchOps.toJS(branch);
    }

    async toString (branch) {
        let logString = '';

        if (this.options.log) {
            const log = await branch.data.log;
            if (log.length > 0) {
                let s = [];

                for await (let e of log) {
                    s.push(e);
                }

                logString = JSON.stringify(s);
            }
        }

        return logString + (await branchOps.toString(branch));
    }

    async getSolutions () {
        const r = [];
        const branches = this.rDB.tables.branches;

        for await (let branch of branches.findByIndex({state: 'yes'})) {
            r.push(branch);
        }

        return r;
    }
}

module.exports = QueryEngine;

