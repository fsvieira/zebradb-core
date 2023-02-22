const QueryEngine = require('../src/branch/queryEngine');
const {DB} = require('../src/db');
const should = require("should");

function test (definitions, tests, options={
    // depth, timeout
}) {
    return async function () {
        const {timeout} = options;

        if (timeout) {
            this.timeout(timeout);
        }

        const db = new DB();
        db.add(definitions);
    
        for (let i=0; i<tests.length; i++) {
            const {
                query, 
                results, 
                process
            } = tests[i];
    
            const qe = await (new QueryEngine(db, options)).init(query);
            
            await qe.run();
            const solutions = await qe.getSolutions();

            const transforms = solutions.map(
                process?async b => process(await qe.toJS(b)):async b => await qe.toString(b)
            );

            const re = await Promise.all(transforms);
            /*
            const re = await Promise.all((await qe.run()).map(
                process?b => process(await b.toJS()):async b => await b.toString()
            ));*/

            should(re.sort()).be.eql(results.sort());
        }

        // done();
    }
}


module.exports = test;



