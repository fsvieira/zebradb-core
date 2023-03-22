const {parse} = require('../parsing');
const {DB: beastDB} = require("beastdb");
const {SHA256} = require("sha2");
const path = require("path");

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
            .index('compareHash')
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

    genCompareHashRec (tuple, id=tuple.root) {
        const v = tuple.variables[id];

        if (v.t) {
            const hash = `T${v.t.length}`;
            let ts = [];
            for (let i=0; i<v.t.length; i++) {
                ts.push(this.genCompareHashRec(tuple, v.t[i]));
            }

            return `${hash}[${ts.join(":")}]`
        }
        else if (v.v) {
            return 'V';
        }
        else if (v.c) {
            return v.c;
        }
    }

    compare (tupleA, tupleB, idA=tupleA.root, idB=tupleB.root, vars={}) {
        const vA = tupleA.variables[idA];
        const vB = tupleB.variables[idB];

        if (vA.body && vB.body && vA.body.length===vB.body.length) {
            console.log("TODO: compare body", vA.body, vB.body);
            /*
                Compare body is complicated, 
                lets return false for now :D
            */
            return false;
        }
        else if (vA.body || vB.body) {
            return false;
        }

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
                console.log("TODO COMPARE EXCEPTIONS!!", vA.e, vB.e);
                /*
                    its hard to compare constrains, for now return false to insert it;
                    1. we can make it lazzy, keeping the constrains separeted, 
                    2. when we are able to replace the 2 variables we can search for it and remove it ? 
                */

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
        }

        return false;
    }


    async genCompareHash (tuple) {
        const hash = SHA256(this.genCompareHashRec(tuple)).toString("base64");

        for await (let r of this.rDB.tables.definitions.findByIndex({compareHash: hash})) {
            const dbTuple = await r.data.tuple;
            const isEqual = this.compare(dbTuple, tuple);

            if (isEqual) {
                return;
            }
        }

        return hash;
    }

    async add(definitions) {
        const tuples = parse(definitions).map(t => {
            t.variables[t.root].checked = true;
            return t;
        });

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
