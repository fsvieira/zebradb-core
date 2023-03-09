const QueryEngine = require('./src/branch/queryEngine');
const {DB} = require('./src/db');

module.exports = {
    definitions: async (definitions) => {
        const db = new DB();
        db.add(definitions);

        return db;
    },
    query: async (db, query, options) => {
        const qe = new QueryEngine(db, options);

        await qe.init(query);
        await qe.run();

        return qe;
    }
}


