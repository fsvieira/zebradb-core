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

