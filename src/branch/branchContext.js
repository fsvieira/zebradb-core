const { v4: uuidv4 } = require('uuid');
const { constants } = require('./operations');

const {SHA256} = require("sha2");

class BranchContext {
    constructor (
        branch,
        branchDB,
        options, 
        definitionDB, 
        rDB, 
        ctx={}
    ) {
        this.branch = branch;
        this.branchDB = branchDB;
        this.options = options;
        this.definitionDB = definitionDB;
        this.rDB = rDB;
        this._ctx = ctx;

        this.variableID = uuidv4();
    }

    static async getContext (
        branch,
        rDB=branch?.table.db, 
        ctx={}
    ) {
        const p = async (field, defaultValue) => {
            const commit = await branch.data.head;

            return ctx[field] 
                || (
                    commit ? await commit.data[field] : defaultValue
                );
        };

        const newCtx = {
            // branchID: ctx.branchID,
            // parent: branch || null,
            root: await p('root'),
            result: await p('result'),
            // level: await p('level', 0) + 1,
            // setsInDomains: await p('setsInDomains', rDB.iSet()),
            // checked: await p('checked', rDB.iSet()),
            // unchecked: await p('unchecked', rDB.iSet()),
            // constraints: await p('constraints', rDB.iSet()),
            unsolvedConstraints: await p('unsolvedConstraints', rDB.iSet()),
            
            variables: await p('variables', rDB.iMap()),
            extendSets: await p('extendSets', rDB.iSet()),
            unsolvedVariables: await p('unsolvedVariables', rDB.iSet()),
            variableCounter: await p('variableCounter', 0),
            // children: [],
            log: await p('log', rDB.iArray()),
            // actions: await p('actions', rDB.iArray()),
            actions: await p('actions'),
            state: await p('state', 'start'),
            // group: await p('group', null),
            // groupState: await p('groupState', null),
            // groups: await p('groups', rDB.iMap()),
            // version: await p('version', 1)
            // graph: await p('graph', {})
        };

        return newCtx;
    }

    static async create (
        branch, 
        branchDB,
        options, 
        definitionDB, 
        rDB=branch?.table.db, 
        ctx={}
    ) {
        const newCtx = await BranchContext.getContext(
            branch, 
            rDB, 
            ctx
        );

        return new BranchContext(
            branch, 
            branchDB,
            options, 
            definitionDB, 
            rDB,
            newCtx
        );
    } 

    // branchDB ops
    async commit () {
        return this.branchDB.commit(this.branch, this._ctx);
    }

    async createBranch () {
        const newBranch = await this.branchDB.createBranch(this.branch);
        return BranchContext.create(
            newBranch, 
            this.branchDB,
            this.options, 
            this.definitionDB, 
            this.rDB
        );
    }

    // === root ===
    get root () {
        return this._ctx.root;
    }

    set root (id) {
        this._ctx.root = id;
        return this;
    }

    // === result ===
    get result () {
        return this._ctx.result;
    }

    set result (id) {
        this._ctx.result = id;
        return this;
    }

    // === Variables === 
    async setVariableValue (id, value) {
        this._ctx.variables = await this._ctx.variables.set(id, value);

        return this;
    }

    async getVariable (id) {
        let v;
        do {
            // console.log("GET VARIABLE ID", id);
            v = await this._ctx.variables.get(id);
            
            if (id && id === v.defer) {
                throw "BUG: id can't defer to itself! " +  id + ' ' + JSON.stringify(v, null, '  ');
            }
    
            id = v.defer;
        }
        while(id);

        /*
        if (v.type === constants.type.SET_SIZE) {
            const set = await this.getVariable(v.variable);
            v = {...v, set, value: await set.size};
        }*/

        // console.log("GET VARIABLE ID = ", id, v);

        return v;
    }

    async hasVariable (id) {
        return this._ctx.variables.has(id);
    }

    newVar (v) {
        return (v?`v$c#${v}`:'v$' + this.variableID + '$' + (++this._ctx.variableCounter));
    }

    // === Logger === 
    async logger (message) {
        if (this.options && this.options.log) {
            const stack = new Error().stack;
            this._ctx.log = await this._ctx.log.push(message + "\nSTACK=" + stack);
        }
    
        return this;
    }

    // === Sets === 
    get extendSets () {
        return this._ctx.extendSets;
    }

    async addExtendSet (cID) {
        this._ctx.extendSets = await this._ctx.extendSets.add(cID);
        return this;
    }

    // === Constraints === 
    set unsolvedConstraints (value) {
        this._ctx.unsolvedConstraints = value;
    }

    get unsolvedConstraints () {
        return this._ctx.unsolvedConstraints;
    }

    async addUnsolvedConstraint (cID) {
        this._ctx.unsolvedConstraints = await this._ctx.unsolvedConstraints.add(cID);
        return this;
    }

    async removeUnsolvedVariable (id) {
        this._ctx.unsolvedVariables = await this._ctx.unsolvedVariables.remove(id);
        return this;
    }

    // === State ===
    set state (value) {
        this._ctx.state = value;  
    }

    get state () {
        return this._ctx.state;
    }

    // === Actions ===
    set actions (value) {
        this._ctx.actions = value;
    }

    get actions () {
        return this._ctx.actions;
    }

    
    /*
    // === graph === 
    set graph (value) {
        this._ctx.graph = value;
    }

    get graph () {
        return this._ctx.graph;
    }*/

    // === definitions DB ===
    async search (v) {
        return this.definitionDB.search(v);
    }

    // === toString === 
    async toStringMaterializedSet (v, vars, rename) {
        let el = [];
        for await (let eID of v.elements.values()) {
            el.push(await this.toStringRec(eID, vars, rename));
        }

        const size = v.size; 
        const domain = v.domain ? ':' + v.domain : '';

        // v.domain && vars.set(v.domain, );

        const setSize = size === el.length ? '' : '...';

        el.sort();
        return `{${el.join(" ")}${setSize}}${domain}`;        
    }

    async toStringConstraint (v, vars, rename) {
        const {a, op, b, state, aValue, bValue, value} = v;
        const av = await this.toStringRec(a, vars, rename);
        const bv = await this.toStringRec(b, vars, rename);

        const s = state === constants.values.C_TRUE ? 
            '::TRUE ' 
            : state === constants.values.C_FALSE ? '::FALSE ' : '';

        const aValueStr = aValue === constants.values.C_TRUE ? 
            'TRUE' 
            : aValue === constants.values.C_FALSE ? 'FALSE' : '';

        const bValueStr = bValue === constants.values.C_TRUE ? 
            'TRUE' 
            : bValue === constants.values.C_FALSE ? 'FALSE' : '';

        const valueStr = value !== undefined ? `<=>${value}`:''

        return `(${av} ${aValueStr}-${op}-${bValueStr} ${bv})${s}${valueStr}`;
    }

    async toStringSetSize (v, vars, rename) {
        return `|${v.variable}| = ${v.value || 'undef'};`
    }

    async toStringRec (id, vars, rename) {
        const v = await this.getVariable(id);

        if (v.domain && !vars.has(v.domain)) {
            const d = await this.getVariable(v.domain);
            const domainVar = rename(d); 
            vars.set(domainVar, "");
            const domainStr = await this.toStringRec(v.domain, vars, rename);
            vars.set(domainVar, domainStr);
        }
    
        let str = "";
        switch (v.type) {
            case constants.type.MATERIALIZED_SET: {
                str =  await this.toStringMaterializedSet(v, vars, rename);
                break;
            }

            case constants.type.TUPLE: {
                const el = [];
                for (let i=0; i<v.data.length; i++) {
                    const eID = v.data[i];
                    el.push(await this.toStringRec(eID, vars, rename))
                }

                const d = v.domain ? await this.getVariable(v.domain) : null;
                const domain = d ? ':' + rename(d) : '';
                str = `(${el.join(" ")})${domain}`;
                break;
            }

            case constants.type.CONSTANT: {
                str =  v.data;
                break;
            }

            case constants.type.LOCAL_VAR: {
                // const domain = v.domain ? ':' + v.domain : '';
                // const varname = v.varname || v.id;
                // return "'" + (!v.pv && v.id?v.id + "::": "") + varname + domain;
                const d = v.domain ? await this.getVariable(v.domain) : null;
                const domain = d ? ':' + rename(d) : '';

                str =  "'" + rename(v) + domain;
                break;
            }

            case constants.type.CONSTRAINT: {
                str =  this.toStringConstraint(v, vars, rename);
                break;
            }

            case constants.type.SET_SIZE: {
                str = this.toStringSetSize(v, vars, rename);
                break;
            }

            case constants.type.INDEX: {
                switch (v.op) {
                    case constants.operation.UNIQUE: {
                        str = 'unique index ' + v.variables.join(',');
                        break;
                    }

                    default: 
                    throw 'Index undefined op ' + v.op;
                }

                break;           
            }

            default:
                console.log(v);
                throw 'toString ' + v.type + ' is not defined!';
        }

        return  str;
    }

    renameGen () {
        const idNameMap = new Map();
        const names = new Set();
        let counter = 1;

        return v => {
            let name = idNameMap.get(v.id);
            if (!name) {
                if (v.pv && v.varname && !names.has(v.varname)) {
                    names.add(v.varname);
                    name = v.varname;
                }
                else {
                    name = `_${v.type}@${counter++}`;
                }
                
                idNameMap.set(v.id, name);
            }

            return name;
        }

    }

    async toString (id=this._ctx.root) {
        const rename = this.renameGen();

        const vars = new Map();
        const str = await this.toStringRec(id, vars, rename);

        let domains = [];
        for (let [domain, def] of vars) {
            domains.push(`${domain} = ${def}`);
        }

        const domainsStr = domains.length ? `\n\n# == Domains == \n${domains.join("\n")}\n` : "";

        const s = `${str}${domainsStr}`;

        return s;
    }

    /*
    snapshot () {
        return new BranchContext(
            this.branch,
            this.options,
            this.definitionDB,
            this.rDB,
            {...this._ctx, branchID: undefined, state: undefined}
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


    async setHash (id, hash) {
        this._ctx.hashVariables = await this._ctx.hashVariables.set(hash, id);
        this._ctx.variablesHash = await this._ctx.variablesHash.set(id, hash);

        return this;
    }
    
    
    async hasChecked (id) {
        return this._ctx.checked.has(id);
    }

    set branchID (value) {
        this._ctx.branchID = value;
    }

    get actions () {
        return this._ctx.actions;  
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

    // tracking lists,
    async addSetInDomain (sID) {
        this._ctx.setsInDomains = await this._ctx.setsInDomains.add(sID);
        return this;
    }

    async addUnsolvedVariable (vID)  {
        this._ctx.unsolvedVariables = await this._ctx.unsolvedVariables.add(vID);
        return this;
    }

    async saveBranch (ignoreConstraints=false) {
        if (!this._ctx.state) {
            this._ctx.state = await this.getContextState(ignoreConstraints);
        }

        if (this.savedBranch) {
            const u = {state: this._ctx.state};
            await this.savedBranch.update(u);
        }
        else {
            const branch = await this.rDB.tables.branches.insert(this._ctx, null); // TODO: Object update on duplicate not working ?
            this.savedBranch = branch;
        }

        return this.savedBranch;
    }

    // TO STRING 
    */
}

module.exports = BranchContext;
