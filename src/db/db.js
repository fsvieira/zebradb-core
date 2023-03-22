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
            t.variables[t.root].checked = true;
            return t;
        });

        for (let i=0; i<tuples.length; i++) {
            const tuple = tuples[i];
//             const ts = normalizeVarnames(tuple);


            console.log("TODO: generate a general hash for definition and then check if they are equal!!");
            /*
                TODO: before generate id and insert to database:
                    1. Generate a general hash (replace varnmes with "'v", ignore domains?, ignore excetions?)
                    2. Check database for the existing of the hash,
                        2a. if not exists we can insert,
                        2a. if does exist we compare all tuples on that hash, if none is equal we can insert.
                    3. Insert:
                        * we can insert normal definition and make a index for the compare hash.

                Notes: the hash can be improved, also we can have more then one hash, or stats.
            */

            const id = SHA256(JSON.stringify(tuple)).toString('base64');

            const definition = await this.rDB.tables.definitions.insert({
                definitionID: id,
                tuple
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
