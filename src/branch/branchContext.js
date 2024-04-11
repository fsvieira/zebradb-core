const { v4: uuidv4 } = require('uuid');
const { constants } = require('./operations');

const {SHA256} = require("sha2");

class BranchContext {
    constructor (
        branch, 
        options, 
        definitionDB, 
        rDB, 
        ctx={}
    ) {
        this.branch = branch;
        this.options = options;
        this.definitionDB = definitionDB;
        this.rDB = rDB;
        this._ctx = ctx;

        this.variableID = uuidv4();
    }

    static async create (
        branch, 
        options, 
        definitionDB, 
        rDB=branch?.table.db, 
        ctx={}
    ) {
        const p = async (field, defaultValue) => {
            return ctx[field] 
                || (
                    branch ? await branch.data[field] : defaultValue
                )
        };

        const newCtx = {
            branchID: ctx.branchID,
            parent: branch || null,
            root: await p('root'),
            level: await p('level', 0) + 1,
            setsInDomains: await p('setsInDomains', rDB.iSet()),
            checked: await p('checked', rDB.iSet()),
            unchecked: await p('unchecked', rDB.iSet()),
            constraints: await p('constraints', rDB.iSet()),
            unsolvedConstraints: await p('unsolvedConstraints', rDB.iSet()),
            variables: await p('variables', rDB.iMap()),
            extendSets: await p('extendSets', rDB.iSet()),
            unsolvedVariables: await p('unsolvedVariables', rDB.iSet()),
            variableCounter: await p('variableCounter', 0),
            children: [],
            log: await p('log', rDB.iArray()),
            state: ctx.state,
            group: await p('group', null),
            groupState: await p('groupState', null),
            groups: await p('groups', rDB.iMap())
        };

        return new BranchContext(
            branch, 
            options, 
            definitionDB, 
            rDB,
            newCtx
        );
    } 

    snapshot () {
        return new BranchContext(
            this.branch,
            this.options,
            this.definitionDB,
            this.rDB,
            {...this._ctx}
        );
    }

    async getContextState(ignoreConstraints=false) {
        return (
            await this._ctx.setsInDomains.size ||
            // await ctx.unchecked.size ||
            (!ignoreConstraints || await this._ctx.unsolvedConstraints.size) ||
            await this._ctx.extendSets.size ||
            await this._ctx.unsolvedVariables.size
        ) ? 'maybe' : 'yes';
    
    }
    
    async getIndexSize (vars) {
        const domains = {};
        let size = 1;
    
        for (let i=0; i<vars.length; i++) {
            const v = vars[i];
    
            if (v.domain) {
                let s = domains[v.domain] || await this.getSetSize(v.domain);
                domains[v.domain] = s;
    
                size = s * size;
            }
            else {
                return Infinity;
            }
        }
    
        return size;
    
    }
    
    async getIndexStats (variables, indexes) {
        const stats = {
            indexes: {},
            min: Infinity,
            max: -Infinity,
        };

        for (let i=0; i<indexes.length; i++) {
            const idxID = indexes[i];
            const index = variables[idxID];
            const vars = index.variables.map(id => variables[id]);
            const indexSize = await this.getIndexSize(vars);

            stats.min = Math.min(indexSize, stats.min);
            stats.max = Math.max(indexSize, stats.max);
            stats.indexes[idxID] = {size: indexSize, vars};
        }

        return stats;
    }

    async getSetSize (setID) {
        let set = await this.getVariable(setID);
    
        /*
            TODO: 
                * The min index size is the max number of elements,
                * The min index size can be the size of the set iff the index vars has no constraints.  
        */

        if (set.size === -1) {
            let size = Infinity;
    
            if (set.definition) {
                const {definition: {variables, root}, defID=root} = set;
                const setDef = variables[defID];
    
                if (setDef.indexes) {    
                    const {min} = await this.getIndexStats(variables, setDef.indexes);
                    size = min;
                }
                else {
                    throw 'getSetSize : has no-index implementation';
                }    
            }
            else {
                console.log("TODO: we need to copy all global domains on init before doing domain getSize");
                console.log("TODO: 'getSetSize : has no-definition implementation'")
                return -1;
            }
    
            if (size === Infinity) {
                return -1;
            }
    
            await this.setVariableValue(set.id, {
                ...set,
                size
            });
        }
        else {
            return set.size;
        }
    }

    async logger (message) {
        if (this.options && this.options.log) {
            const stack = new Error().stack;
            this._ctx.log = await this._ctx.log.push(message + "\nSTACK=" + stack);
        }
    
        return this;
    }

    // sets in domains
    async removeSetsInDomains (element) {
        this._ctx.setsInDomains = await this._ctx.setsInDomains.remove(element);

        return this;
    }

    async removeUnchecked (element) {
        this._ctx.unchecked = await this._ctx.unchecked.remove(element);

        return this;
    }

    async removeExtendSet (setID) {
        this._ctx.extendSets = await this._ctx.extendSets.remove(setID);
        return this;
    }

    async removeUnsolvedVariable (id) {
        this._ctx.unsolvedVariables = await this._ctx.unsolvedVariables.remove(id);
        return this;
    }

    async setHash (id, hash) {
        this._ctx.hashVariables = await this._ctx.hashVariables.set(hash, id);
        this._ctx.variablesHash = await this._ctx.variablesHash.set(id, hash);

        return this;
    }
    
    // variables,
    async setVariableValue (id, value, hash) {
        this._ctx.variables = await this._ctx.variables.set(id, value);

        if (hash) {
            await this.setHash(id, hash);
        }

        return this;
    }

    async getVariable (id) {
        let v;
        do {
            v = await this._ctx.variables.get(id);
            
            if (id && id === v.defer) {
                throw "BUG: id can't defer to itself! " +  id + ' ' + JSON.stringify(v, null, '  ');
            }
    
            id = v.defer;
        }
        while(id);
    
        return v;
    }

    async hasVariable (id) {
        return this._ctx.variables.has(id);
    }

    async hasChecked (id) {
        return this._ctx.checked.has(id);
    }

    set state (value) {
        this._ctx.state = value;  
    }

    set branchID (value) {
        this._ctx.branchID = value;
    }

    get root () {
        return this._ctx.root;
    }

    set unsolvedConstraints (value) {
        this._ctx.unsolvedConstraints = value;
    }

    get unsolvedConstraints () {
        return this._ctx.unsolvedConstraints;
    }

    get setsInDomains () {
        return this._ctx.setsInDomains;
    }

    get unsolvedVariables () {
        return this._ctx.unsolvedVariables;
    }

    get extendSets () {
        return this._ctx.extendSets;
    }

    async currentState () {
        if (!this._ctx.state) {
            return await this.getContextState()
        }

        return this._ctx.state;
    }

    newVar (v) {
        return (v?`v$c#${v}`:'v$' + this.variableID + '$' + (++this._ctx.variableCounter));
    }

    // definitions DB 
    async search (v) {
        return this.definitionDB.search(v);
    }

    // tracking lists,
    async addSetInDomain (sID) {
        this._ctx.setsInDomains = await this._ctx.setsInDomains.add(sID);
        return this;
    }

    async addUnsolvedVariable (vID)  {
        this._ctx.unsolvedVariables = await this._ctx.unsolvedVariables.add(vID);
        return this;
    }

    async addUnsolvedConstraint (cID) {
        this._ctx.unsolvedConstraints = await this._ctx.unsolvedConstraints.add(cID);
        return this;
    }

    async addExtendSet (cID) {
        this._ctx.extendSets = await this._ctx.extendSets.add(cID);
        return this;
    }

    async saveBranch (ignoreConstraints=false) {
        if (!this._ctx.state) {
            this._ctx.state = await this.getContextState(ignoreConstraints);
        }

        return await this.rDB.tables.branches.insert(this._ctx, null);
    }

    // TO STRING 
    async toStringMaterializedSet(v, vars) {
        let el = [];
        for await (let eID of v.elements.values()) {
            el.push(await this.toStringRec(eID, vars));
        }

        console.log("=== MATRIX ===>", JSON.stringify(v.matrix));

        const size = v.size; 
        const domain = v.domain ? ':' + v.domain : '';

        v.domain && vars.add(v.domain);

        const setSize = size === el.length ? '' : '...';

        return `{${el.sort().join(" ")} ${setSize}}${domain}`;        
    }

    async toStringConstraint (v, vars) {
        const {a, op, b} = v;
        const av = await this.toStringRec(a, vars);
        const bv = await this.toStringRec(b, vars);

        return `${av} ${op} ${bv}`;
    }

    async toStringRec (id, vars) {
        const v = await this.getVariable(id);

        switch (v.type) {
            case constants.type.MATERIALIZED_SET: {
                return await this.toStringMaterializedSet(v, vars);
            }

            case constants.type.TUPLE: {
                const el = [];
                for (let i=0; i<v.data.length; i++) {
                    const eID = v.data[i];
                    el.push(await this.toStringRec(eID, vars))
                }

                return `(${el.join(" ")})`;
            }

            case constants.type.CONSTANT: {
                return v.data;
            }

            case constants.type.LOCAL_VAR: {
                
                const domain = v.domain ? ':' + v.domain : '';
                v.domain && vars.add(v.domain);

                const varname = v.varname || v.id;
                return "'" + (!v.pv && v.id?v.id + "::": "") + varname + domain;
            }

            case constants.type.CONSTRAINT: {
                return this.toStringConstraint(v, vars);
            }

            default:
                console.log(v);
                throw 'toString ' + v.type + ' is not defined!';
        }
    }

    async toString (id=this._ctx.root) {
        const vars = new Set();
        const str = this.toStringRec(id, vars);

        for (let v of vars) {
            console.log("print variables", v);
        }

        return str;
    }
}

module.exports = BranchContext;
