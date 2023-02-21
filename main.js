const QueryEngine = require('./src/branch/queryEngine');
const {DB} = require('./src/db');

const db = new DB();

// db.add(`(yellow blue)`);
// const qe = new QueryEngine(db, `('x 'y)`);

/*
"('x 'y) (('a 'a))", [{
    query: "?((yellow 'c))",
    results: ["@(@(yellow yellow))"]
}]*/

db.add(`('x 'y) (('a 'a))`);
const qe = new QueryEngine(db, `((yellow 'c))`);

qe.run();
