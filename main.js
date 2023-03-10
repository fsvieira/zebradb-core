/*
const QueryEngine = require('./src/branch/queryEngine');
const {DB} = require('./src/db');

async function main () {
    const db = new DB();

    // db.add(`(yellow blue)`);
    // const qe = new QueryEngine(db, `('x 'y)`);

    db.add(`('x 'y) (('a 'a))`);
    const qe = await (new QueryEngine(db, {
        path: 'dbs/lib/1', 
        timeout: 2000 * 30,
        log: true
    })).init(`((yellow 'c))`);

    await qe.run();

    const solutions = await qe.getSolutions();

    console.log((await Promise.all(solutions.map(async b => await qe.toString(b)))).join("\n\n"));
}

main();
*/

const {definitions, query} = require(".");

async function main() {
    const db = await definitions(
        {
            path: 'dbs'
        }, 
        {
            author: 'fsvieira',
            name: 'test',
            version: '1.0.0'
        }, 
        `('x 'y) (('a 'a))`
    );

    const run = await query(db, `((yellow 'c))`, {
        path: 'dbs/lib/1', 
        timeout: 2000 * 30,
        log: true
    });

    const solutions = await run.getSolutions();

    console.log((await Promise.all(solutions.map(async b => await run.toString(b)))).join("\n\n"));

}

main();

