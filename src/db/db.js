const {parse} = require('../parsing');
// const { v4 } = require('uuid');
// const FSA = require("fsalib");

const path = require("path");
const {SHA256} = require("sha2");

const {DB: beastDB} = require("beastdb");

const varname = () => {
    const varnames = {};
    let counter = 1;
    return name => {
        let v = varnames[name];

        if (!v) {
            v = varnames[name] = `v_${counter++}`;
        }

        return v;
    }
}

const normalizeVarnames = (v, vn=varname()) => {

    if (v.t) {
        const t = [];
        for (let i=0; i < v.t.length; i++) {
            t.push(normalizeVarnames(v.t[i], vn));
        }

        const body = v.body?v.body.map(t => normalizeVarnames(t, vn)):undefined;

        return {...v, t, body};
    }
    else if (v.v) {
        const e = v.e?v.e.map(v => normalizeVarnames(v, vn)):undefined;
        return {...v, v: vn(v.v), e};
    }
    else if (v.c) {
        return v;
    }
    else {
        throw "Unknwon type ", JSON.stringify(v);
    }
}

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
            .save()
        ;

        await this.rDB.tables.definitionIndexes
            .key('definitionIndexID', ['definition', 'type', 'position', 'tupleLength'])
            .index('type', 'position', 'tupleLength')
            .index('position', 'tupleLength')
            .save()
        ;

    }

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
    }

    async add(definitions) {
        const tuples = parse(definitions).map(t => {
            t.checked = true;
            return t;
        });

        for (let i=0; i<tuples.length; i++) {
            const tuple = tuples[i];
            const ts = normalizeVarnames(tuple);
            const id = SHA256(JSON.stringify(ts)).toString('base64');

            const definition = await this.rDB.tables.definitions.insert({
                definitionID: id,
                tuple
            }, null);

            // make indexes
            for (let i=0; i<tuple.t.length; i++) {
                const v = tuple.t[i];

                await this.rDB.tables.definitionIndexes.insert({
                    definition,
                    tupleLength: tuple.t.length,
                    type: this.getType(v),
                    position: i
                }, null);
            }
        }
    }

    async search (tuple) {
        const definitionIndexes = this.rDB.tables.definitionIndexes;
        let results = [];

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

        return Promise.all(results.map(async d => d.data.tuple));
    }
}

module.exports = DB;
