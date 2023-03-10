const QueryEngine = require('./src/branch/queryEngine');
const {DB} = require('./src/db');

module.exports = {
    definitions: async (options, packageName, definitions) => {
        const db = new DB(options, packageName);
        await db.init();
        await db.add(definitions);

        return db;
    },
    query: async (db, query, options) => {
        const qe = new QueryEngine(db, options);

        await qe.init(query);
        await qe.run();

        return qe;
    }
}


