/*
const QueryEngine = require('../src/branch/queryEngine');
const {DB} = require('../src/db');*/
const z = require("../index");
const path = require("path");
const should = require("should");

function test (definitions, tests, options={
    // depth, timeout
}) {
    return async function () {
        const {timeout} = options;

        if (timeout) {
            this.timeout(timeout);
        }

        /*
        const db = new DB();
        db.add(definitions);
        */

        const db = await z.definitions(
            {
                path: path.join(options.path, 'definitions')
            }, 
            {
                author: 'fsvieira',
                name: 'test',
                version: '1.0.0'
            }, 
            definitions
        );
    
        for (let i=0; i<tests.length; i++) {
            const {
                query, 
                results, 
                process
            } = tests[i];
    
            /*const qe = await (new QueryEngine(db, options)).init(query);
            
            await qe.run();*/

            const qe = await z.query(db, query, {
                ...options,
                path: path.join(options.path, 'run')
            });

            const solutions = await qe.getSolutions();
            const transforms = solutions.map(
                process?
                    async b => process(await qe.toJS(b))
                    :
                    async b => (await qe.toString(b)).replace(/\s+/g, ' ').trim()
            );

            const re = await Promise.all(transforms);
            
            should(re.sort()).be.eql(results.map(r => r.replace(/\s+/g, ' ').trim()).sort());
        }
    }
}


module.exports = test;



