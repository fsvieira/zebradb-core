const { v4: uuidv4 } = require('uuid');
const { constants } = require('./operations');

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

    /*
    function varGenerator (counter) {
        const vID = uuidv4();

        return {
            varCounter: () => counter,
            newVar: v => {
                const varname = (v?getConstantVarname(v):'v$' + vID + '$' + (++counter));
                return varname;
            }
        }
    }
    */


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
            variables: await p('variables', rDB.iSet()),
            extendSets: await p('extendSets', rDB.iSet()),
            unsolvedVariables: await p('unsolvedVariables', rDB.iSet()),
            variableCounter: await p('variableCounter', 0),
            children: [],
            log: await p('log', rDB.iArray()),
            state: ctx.state
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

    async getContextState() {
        return (
            await this._ctx.setsInDomains.size ||
            // await ctx.unchecked.size ||
            await this._ctx.unsolvedConstraints.size ||
            await this._ctx.extendSets.size ||
            await this._ctx.unsolvedVariables.size
        ) ? 'maybe' : 'yes';
    
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



    // variables,
    async setVariableValue (id, value) {
        this._ctx.variables = await this._ctx.variables.set(id, value);
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

    async saveBranch () {
        if (!this._ctx.state) {
            this._ctx.state = await this.getContextState()
        }

        return await this.rDB.tables.branches.insert(this._ctx, null);
    }

    // TO STRING 
    async toStringMaterializedSet(v) {
        let el = [];
        for await (let eID of v.elements.values()) {
            el.push(await this.toString(eID));
        }

        const size = v.size; 
        const domain = v.domain ? ':' + v.domain : '';

        return `{${el.join(" ")} ${size === -1 ? '...': ''}}${domain}`;        
    }

    async toString (id=this._ctx.root) {
        const v = await this.getVariable(id);

        let str = '';
        switch (v.type) {
            case constants.type.MATERIALIZED_SET: {
                str += await this.toStringMaterializedSet(v);
            }
        }
        console.log(str);

        return str;
    }
}

module.exports = BranchContext;
