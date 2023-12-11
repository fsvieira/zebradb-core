const {parse} = require('../parsing');
const {DB: beastDB} = require("beastdb");
const {SHA256} = require("sha2");
const path = require("path");

const {branchOps} = require("../branch");

const {
    type: {
        CONSTANT, // : "c",
        TUPLE, // : "t",
        CONSTRAINT, // : "cs",
        SET, // : "s",
        SET_CS, // 'sc'
        SET_EXP, // 'se'
        LOCAL_VAR, // : 'lv',
        GLOBAL_VAR, // : 'gv',
        DEF_REF // d
    },
    operation: {
        OR, // : "or",
        AND, // : "and",
        IN, // : "in",
        UNIFY, // : "=",
        NOT_UNIFY, // : "!="
    }
} = branchOps.constants;


class DB {
    constructor (options, packageInfo) {
        this.options = options;
        this.packageInfo = packageInfo;
    }

    async init () {
        this.rDB = await beastDB.open({
            storage: {
                path: path.join(
                    this.options.path, 
                    'definitions', 
                    this.packageInfo.author, 
                    this.packageInfo.name, 
                    this.packageInfo.version, 
                    'data.db'
                )
            }
        });
        
        await this.rDB.tables.definitions
            .key('definitionID')
            // .index('compareHash')
            .save()
        ;

        // find definitions by var name and id,
        await this.rDB.tables.definitionVariables
            .key('definitionsVariablesID', ["varname", "definition"])
            .index("varname")
            .save()
        ;

        await this.rDB.tables.definitionIndexes
            .key('definitionIndexID', ['tupleRef', 'type', 'position', 'tupleLength'])
            .index('type', 'position', 'tupleLength')
            .index('position', 'tupleLength')
            .save()
        ;

    }

    /*
    getType (v) {
        if (v.t) {
            return 'T' + v.t.length;
        }
        else if (v.v) {
            return 'V'
        }
        else if (v.c) {
            return 'C:' + v.c  
        }
        else {
            throw `Unkown type, ${JSON.stringify(v)}.`;
        }
    }*/

    genDefinitionHashID (v) {
        const type = v.constructor.name;
        let s = v;

        switch (v.constructor.name) {
            case 'Object': {
                const keys = Object.keys(v).sort();
                const values = [];
                for (let i=0; i<keys.length; i++) {
                    const key = keys[i];
                    const value = v[key];
                    if (value !== undefined) {
                        if (v[key] !== null) {
                            values.push([key, this.genDefinitionHashID(v[key])]);
                        }
                    }
                }

                s = JSON.stringify(values);
                break;
            }
            case 'Array': {
                const values = v.map(e => this.genDefinitionHashID(e));
                s = JSON.stringify(values)
                break;
            }
            case 'Record': {
                s = `${v.table.name}:${v.id}`;
                break;
            }
            case 'Number':
            case 'String': 
            case 'Boolean': 
                break;
            default: 
                throw `genDefinitionHashID: Unknown Type ${v.constructor.name}`;
        }

        const id = SHA256(`${type}:${s}`).toString('base64');
        return id;

    }

    genCompareHashRec (tuple, id=tuple.root) {
        const v = tuple.variables[id];

        switch (v.type) {
            case TUPLE: {
                const hash = `T${v.data.length}`;
                let ts = [];
                for (let i=0; i<v.data.length; i++) {
                    ts.push(this.genCompareHashRec(tuple, v.data[i]));
                }

                return `${hash}[${ts.join(":")}]`
            }
            
            case LOCAL_VAR: {
                return 'V';
            }
            
            case GLOBAL_VAR: {
                return 'G' + v.cid;
            }
            
            case CONSTANT: {
                return `C${v.data}`;
            }
            
            case SET: {
                const hash = `S${v.size}`;
                let ts = [];
                for (let i=0; i<v.elements.length; i++) {
                    ts.push(this.genCompareHashRec(tuple, v.elements[i]));
                }

                return `${hash}[${ts.join(":")}]`
            }
            
            case DEF_REF: {
                return `DR${v.data.id}`;
            }

            case SET_CS: {
                return `SC::${this.genCompareHashRec(tuple, v.element)}`
            }

            case SET_EXP: {
                const a = this.genCompareHashRec(tuple, v.a);
                const b = this.genCompareHashRec(tuple, v.b);

                return `SE::${a}:${v.op}:${b}`;
            }

            default:
                throw `Gen Compare HASH, unkwon type ${v.type}`
        }
    }

    compare (tupleA, tupleB, idA=tupleA.root, idB=tupleB.root, vars={}) {
        const vA = tupleA.variables[idA];
        const vB = tupleB.variables[idB];

        /*if (vA.body && vB.body && vA.body.length===vB.body.length) {
            //    Compare body is complicated, 
            //    lets return false for now :D
            return false;
        }
        else if (vA.body || vB.body) {
            return false;
        }*/

        if (vA.type === vB.type) {
            switch (vA.type) {
                case CONSTANT: return vA.data === vB.data;
                case TUPLE: {
                    if (vA.data.length === vB.data.length) {
                        for (let i=0; i<vA.data.length; i++) {
                            const cmp = this.compare(tupleA, tupleB, vA.data[i], vB.data[i], vars);
            
                            if (!cmp) {
                                return false;
                            }
                        }

                        return true;
                    }

                    return false;
                }
                case SET: {
                    if (vA.size === vB.size) {
                        for (let i=0; i<vA.elements.length; i++) {
                            
                            const cmp = this.compare(
                                tupleA, 
                                tupleB, 
                                vA.elements[i], 
                                vB.elements[i]
                            );

                            if (!cmp) {
                                return false;
                            }
                        }

                        return true;
                    }

                    return false;
                }

                case DEF_REF: {
                    return vA.data.id === vB.data.id
                }

                case LOCAL_VAR: {
                    const v = vars[vA.cid];

                    if (!v) {
                        vars[vA.cid] = vB;
                        return true;
                    }
                    else if (vB.cid !== v.cid) {
                        return this.compare(
                            tupleA, 
                            tupleB, 
                            vA, 
                            v,
                            vars
                        );
                    }

                    return true;
                }

                case SET_CS: {
                    return this.compare(
                        tupleA, 
                        tupleB, 
                        vA.element, 
                        vB.element,
                        vars
                    ) 
                }

                case GLOBAL_VAR: {
                    return vA.cid === vB.cid;
                }
                    
                case SET_EXP: {
                    return vA.op === vB.op && 
                        this.compare(
                            tupleA,
                            tupleB,
                            vA.a,
                            vB.a,
                            vars
                        ) && 
                        this.compare(
                            tupleA,
                            tupleB,
                            vA.b,
                            vB.b,
                            vars
                        )
                }

                default:
                    throw `COMPARE NOT IMPLEMENTED: ${vA.type} = ${vB.type}`
            }
        }

        /*
        if (vA.c && vB.c) {
            return vA.c === vB.c;
        }
        else if (vA.v && vB.v) {
            const rB = vars[vA.id];

            if (rB) {
                return rB === vB.id;
            }

            if (vA.d && vB.d && vA.d.length === vB.d.length) {
                for (let i=0; i<vA.d.length; i++) {
                    if (vA.d[i] !== vB.d[i]) {
                        return false;
                    }
                }
            }
            else if (vA.d || vB.d) {
                return false;
            }

            if (vA.e && vB.e && vA.e.length === vB.e.length) {
                // its hard to compare constraints, for now return false to insert it;
                //   1. we can make it lazzy, keeping the constraints separeted, 
                //   2. when we are able to replace the 2 variables we can search for it and remove it ? 

                return false;
            }
            else if (vA.e || vB.e) {
                return false;
            }

            vars[vA.id] = vB.id;
            return true;
        }
        else if (vA.t && vB.t && vA.t.length === vB.t.length) {
            for (let i=0; i<vA.t.length; i++) {
                const cmp = this.compare(tupleA, tupleB, vA.t[i], vB.t[i]);

                if (!cmp) {
                    return false;
                }
            }

            return true;
        }*/

        return false;
    }


    async genCompareHash (definition) {
        const defHash = this.genCompareHashRec(definition);
        const hash = SHA256(defHash).toString("base64");

        for await (let def of this.rDB.tables.definitions.findByIndex({compareHash: hash})) {
            const dbDef = await def.data.definition;
            const isEqual = this.compare(dbDef, definition);

            if (isEqual) {
                return [hash, def];
            }
        }

        return [hash, null];
    }

    async addSet (def, varID=def.root) {
        const {variables, globalVariable} = def;

        const set = variables[varID];

        if (set.size > 0) {
            const elements = new Set();
            const sVariables = {
                [globalVariable]: variables[globalVariable]
            };

            console.log("TODO: (ADD SET DEF) check for duplicates defRecord!!");
            for (let i=0; i<set.size; i++) {
                const varID = set.elements[i];

                const v = def.variables[varID];
                switch (v.type) {
                    /*case TUPLE: {
                        const defRecord = await this.addElement(def, varID);

                        sVariables[varID] = {
                            type: DEF_REF,
                            data: defRecord,
                            cid: varID
                        };

                        elements.add(varID);
                        break;
                    }*/
                    case CONSTANT: {
                        sVariables[varID] = v;
                        elements.add(varID);
                        break;
                    }
                    default: 
                        throw 'addSet - Not implemented! ' + v.type;
                }
            }

            sVariables[varID] = {
                ...set,
                elements: [...elements].sort(),
                cid: varID
            };

            const saveSet = {
                variables: sVariables,
                root: varID
            };

            let [compareHash, definition] = await this.genCompareHash(saveSet);

            if (!definition) {
                const id = this.genDefinitionHashID(saveSet);

                definition = await this.rDB.tables.definitions.insert({
                    definitionID: id,
                    definition: saveSet,
                    compareHash
                }, null);
            }
            // else should we update with globalVariables.

            await this.rDB.tables.definitionVariables.insert({
                varname: globalVariable,
                definition
            }, null);

            // No need for indexes because sets will be searched by variable name,
            // if a match is done with an element, then element must have the set reference.
            return definition;
        }
        else {
            throw 'Undefined set size';
        }

    }

    getTuple (def, varID) {
        const variables = {};

        const stack = [varID];

        do {
            const vID = stack.pop();

            if (!variables[vID]) {
                const d = variables[vID] = def.variables[vID];

                switch (d.type) {
                    case TUPLE: {
                        d.domain && stack.push(d.domain);
                        stack.push(...d.data); 
                        break;
                    }
                    case LOCAL_VAR: {
                        d.domain && stack.push(d.domain);
                        d.constraints && stack.push(...d.constraints);
                        break;
                    }
                    case CONSTRAINT: {
                        stack.push(d.a, d.b);
                        d.constraints && stack.push(...d.constraints);
                        break;
                    }
                    default:
                        console.log(`TT TYPE ${d.type}`);
                }
            }
        }
        while (stack.length);

        return {
            variables,
            root: varID
        };
    }

    async addTuple (def, varID) {
        /* 
            1. register tuple, associate tuple as globalSet variable ??
        */

        const tuple = this.getTuple(def, varID);

        tuple.variables[tuple.root].checked = true;

        let [compareHash, definition] = await this.genCompareHash(tuple);

        if (!definition) {
            // id = SHA256(JSON.stringify(tuple)).toString('base64');
            const id = this.genDefinitionHashID(tuple);

            definition = await this.rDB.tables.definitions.insert({
                definitionID: id,
                definition: tuple,
                compareHash
            }, null);

            // make indexes
            const root = tuple.variables[tuple.root];

            for (let i=0; i<root.data.length; i++) {
                const v = tuple.variables[root.data[i]];

                await this.rDB.tables.definitionIndexes.insert({
                    definition,
                    tupleLength: root.data.length,
                    type: v.type,
                    position: i
                }, null);
            }
        }

        return definition;

        // throw `Add Tuple ${JSON.stringify(def, null, '  ')}`;
    }

    async addSetConstrain (def, varID) {
        const {variables, globalVariable} = def;

        const set = variables[varID];
        const sVariables = {
            [globalVariable]: variables[globalVariable]
        };

        const {element: elementID} = set;
        const v = def.variables[elementID];
        
        switch (v.type) {
            /*case TUPLE: {
                const defRecord = await this.addElement(def, elementID);

                sVariables[elementID] = {
                    type: DEF_REF,
                    data: defRecord,
                    cid: elementID
                };

                break;
            }*/

            case LOCAL_VAR: {
                sVariables[v.cid] = v;
                break;
            }

            default: 
                throw 'addSetConstrain - Not implemented! ' + v.type;
        }

        sVariables[varID] = {
            ...set,
            element: elementID
        };

        const saveSet = {
            variables: sVariables,
            root: varID
        };

        let [compareHash, definition] = await this.genCompareHash(saveSet);

        if (!definition) {
            const id = this.genDefinitionHashID(saveSet);

            definition = await this.rDB.tables.definitions.insert({
                definitionID: id,
                definition: saveSet,
                compareHash
            }, null);
        }
        
        // else should we update with globalVariables.
        await this.rDB.tables.definitionVariables.insert({
            varname: globalVariable,
            definition
        }, null);

        // No need for indexes because sets will be searched by variable name,
        // if a match is done with an element, then element must have the set reference.
        return definition;
    }

    async addSetExpression (def, varID=def.root) {
        const {variables, globalVariable} = def;

        const set = variables[varID];
        const sVariables = {
            [globalVariable]: variables[globalVariable]
        };

        const solve = async id => {
            const v = def.variables[id];

            switch (v.type) {
                case GLOBAL_VAR: {
                    sVariables[id] = def.variables[id]
                    return id;
                }

                default: 
                    throw 'Add expression solve unknown type ' + v.type;   
            }
        } 

        const {a, b} = set;

        sVariables[varID] = {
            ...set,
            a: await solve(a),
            b: await solve(b)
        };

        const saveSet = {
            variables: sVariables,
            root: varID
        };

        let [compareHash, definition] = await this.genCompareHash(saveSet);

        if (!definition) {
            const id = this.genDefinitionHashID(saveSet);

            definition = await this.rDB.tables.definitions.insert({
                definitionID: id,
                definition: saveSet,
                compareHash
            }, null);
        }
        
        // else should we update with globalVariables.
        await this.rDB.tables.definitionVariables.insert({
            varname: globalVariable,
            definition
        }, null);

        // No need for indexes because sets will be searched by variable name,
        // if a match is done with an element, then element must have the set reference.
        return definition;
    }

    async genIndexesTuple (def, tuple, ref) {
        ref = ref.concat(tuple.cid);

        for (let i=0; i<tuple.data.length; i++) {
            const v = def.variables[tuple.data[i]];

            await this.rDB.tables.definitionIndexes.insert({
                tupleRef: ref,
                tupleLength: tuple.data.length,
                type: v.type,
                position: i
            }, null);
        }
    }

    async genIndexesSet (def, set, ref) {
        const {elements} = set;
        for (let i=0; i<elements.length; i++) {
            const eID = elements[i];
            const e = def.variables[eID];

            switch (e.type) {

                case CONSTANT:
                    // nothing to do,
                    break;

                default:
                    throw 'UNKOWN SET INDEX TO GENERATE ' + e.type;
            }   
        }
    }

    async genIndexesSetCs (def, set, ref) {
        const {element: eID} = set;
        const e = def.variables[eID];

        ref = ref.concat(set.cid);
        switch (e.type) {
            case SET_CS:
                await this.genIndexesSetCs(def, e, ref);
                break;

            case TUPLE:                
                await this.genIndexesTuple(def, e, ref);
                break;

            case CONSTANT:
                // nothing to do,
                break;

            default:
                throw 'UNKOWN SET INDEX TO GENERATE ' + e.type;
        }
    }


    async addElement (def) {

        const globalVariable = def.globalVariable;
        
        const defRecord = await this.rDB.tables.definitions.insert({
            definitionID: globalVariable,
            definition: def
        }, null);

        const root = def.variables[def.root];

        const ref = [defRecord];

        switch (root.type) {
            case SET: {
                await this.genIndexesSet(def, root, ref);
                break;
            }

            case SET_CS: {
                await this.genIndexesSetCs(def, root, ref);
                break;
            }

            default:
                throw 'UNKOWN GEN INDEX ' + root.type;
        }

        return defRecord;

        /*const type = def.variables[varID].type;

        switch (type) {
            case SET: return this.addSet(def, varID);
            case SET_CS: return this.addSetConstrain(def, varID);
            case SET_EXP: return this.addSetExpression(def, varID);
            default:
                throw `Unkown def type ${type}`;
        }*/

        /*switch (type) {
            case SET: return this.addSet(def, varID);
            case TUPLE: return this.addTuple(def, varID);
            case SET_CS: return this.addSetConstrain(def, varID);
            case SET_EXP: return this.addSetExpression(def, varID);
            default:
                throw `Unkown def type ${type}`;
        }*/
    }

    async add(definitions) {
        const defs = parse(definitions); /*.map(t => {
            t.variables[t.root].checked = true;
            return t;
        });*/

        for (let i=0; i<defs.length; i++) {
            const def = defs[i];

            await this.addElement(def);
        }

        /*
        for (let i=0; i<tuples.length; i++) {
            const tuple = tuples[i];
            const compareHash = await this.genCompareHash(tuple);

            if (compareHash) {
                const id = SHA256(JSON.stringify(tuple)).toString('base64');

                const definition = await this.rDB.tables.definitions.insert({
                    definitionID: id,
                    tuple,
                    compareHash
                }, null);

                // make indexes
                const root = tuple.variables[tuple.root];

                for (let i=0; i<root.t.length; i++) {
                    const v = tuple.variables[root.t[i]];

                    await this.rDB.tables.definitionIndexes.insert({
                        definition,
                        tupleLength: root.t.length,
                        type: this.getType(v),
                        position: i
                    }, null);
                }
            }
        }*/
    }

    async getDefByVariable (variable) {
        const definitionVariables = this.rDB.tables.definitionVariables;

        const index = {varname: variable.cid};
        for await (let d of definitionVariables.findByIndex(index)) {
            const def = await d.data.definition;
            const definition = await def.data.definition;
            return definition;
        }

        throw 'Global variable ' + variable.id + " is not defined!";
    }

    async search (def) {
        // const definitionIndexes = this.rDB.tables.definitionIndexes;
        // let results = [];

        switch (def.type) {
            case GLOBAL_VAR: {
                const dups = {[def.cid]: true};
                const stack = [def];

                let r;
                do {
                    const def = stack.pop();
                    const d = await this.getDefByVariable(def);

                    const ds = {
                        ...d,
                        variables: {...d.variables}                    
                    }
    
                    if (r) {
                        r.variables[def.cid].definition = ds;
                    }
                    else {
                        r = ds;
                    }

                    for (let vID in ds.variables) {
                        const v = ds.variables[vID];

                        if (v.type === GLOBAL_VAR
                            && !dups[v.cid]    
                        ) {
                            dups[def.cid] = true;
                            stack.push(v);
                        }
                    }
                }
                while (stack.length > 0);

                return r;
            }

            case TUPLE: {
                throw `SEARCH BY TUPLE ${JSON.stringify(def)} NOT IMPLEMENTED;`;
            }

            default:
                throw `SEARCH ${JSON.stringify(def)} NOT IMPLEMENTED;`;
        }
        /*
        for (let i=0; i<tuple.t.length; i++) {
            const v = tuple.t[i];

            const type = this.getType(v);

            const index = {
                position: i,
                tupleLength: tuple.t.length
            };

            const check = {};
            if (type === 'V') {
                for await (let d of definitionIndexes.findByIndex(index)) {
                    const definition = await d.data.definition;
                    check[definition.id] = definition;
                }
            }
            else {
                index.type = type;
                for await (let d of definitionIndexes.findByIndex(index)) {
                    const definition = await d.data.definition;
                    check[definition.id] = definition;
                }

                index.type = 'V';
                for await (let d of definitionIndexes.findByIndex(index)) {
                    const definition = await d.data.definition;
                    check[definition.id] = definition;
                }
            }

            if (i === 0) {
                results = Object.keys(check).map(k => check[k]);
            }
            else {
                results = results.filter(d => check[d.id]);
            }

            if (results.length === 0) {
                return [];
            }
        }

        return Promise.all(results.map(async d => ({...(await d.data.tuple), did: d.id})));
        */
    }
}

module.exports = DB;
