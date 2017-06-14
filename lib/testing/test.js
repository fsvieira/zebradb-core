const should = require("should");
const utils = require("../utils");
const Session = require("../manager/manager");

function trim (s) {
    return s.replace(/\n+/g, ' ')
            .replace(/\t+/g, ' ')
            .replace(/ +/g, ' ')
    ;
}

function test (code, result, options) {
    
    return function () {
        return new Promise(function (resolve, reject) {
            // TODO: make session a class,
            const session = new Session();
            const queries = {};
            const keys = [];
            
            session.events.on('halt', function () {
                const s = [];
                var queryId = session.zvs.data.global("query");
                
                for (var i=0; i<keys.length; i++) {
                    const branchQueryId = keys[i];
                    const query = session.zvs.getObject(branchQueryId, session.zvs.data.global("query"));
                    const r = queries[branchQueryId];
                    
                    s.push("?" + utils.toString(query, true) + ":\n" +
                        (r.length?r.map(function (branchId) {
                            return "\t" + utils.toString(session.zvs.getObject(branchId, queryId), true);
                        }).join("\n"):"\t<empty>\n")
                    );
                }
                
                const r = s.join("\n");
                try {
                    should(trim(r)).eql(trim(result));
                    resolve();
                }
                catch (e) {
                    reject(e);
                }
            });
            
            session.events.on('query-start', function (queryBranchId) {
                keys.push(queryBranchId);
                queries[queryBranchId] = queries[queryBranchId] || [];
            });
            
            session.events.on('success', function (branchId) {
                const queryBranchId = session.zvs.getObject(branchId, session.zvs.data.global("queryBranchId")).data;
                queries[queryBranchId].push(branchId);
            });
            
            session.add(code);
        });
    };
    
    /*
    return function () {
        return new Promise(function (resolve, reject) {
            var run = new Z(options?options.deep:undefined);
        
            const zvs = run.zvs;
            flyd.scan(function (results, {branchId, end, halt, filter}) {
                
                if (filter) {
                    results.filter = filter;
                }
                else if (halt) {
                    results.end = true;
                }
                else {
                    const queryBranchId = branchId?zvs.getObject(branchId, zvs.data.global("queryBranchId")).data:end;
                    results.queries[queryBranchId] = results.queries[queryBranchId] || [];

                    if (branchId) {            
                        results.queries[queryBranchId].push(branchId);
                    }
                }
                
                if (results.filter && results.end) {
                    var s = []; 
                    for (var i=0; i<results.filter.length; i++) {
                        const {query, queryBranchId} = results.filter[i];
                        const branches = results.queries[queryBranchId];
                        
                        const r = [];
                        
                        branches.forEach(function (branchId) {
                            const q = "\t" + utils.toString(zvs.getObject(branchId, zvs.data.global("query")), true);
                            
                            if (r.indexOf(q) === -1) {
                                r.push(q);
                            }
                        });
                        
                        s.push("?" + utils.toString(query, true) + ":\n" + 
                            (r.length > 0?r.sort().join("\n"):"<empty>")
                        );
                    }
                    
                    try {
                        should(
                            s.join("\n")
                                .replace(/\n+/gi, " ")
                                .replace(/\t+/gi, " ")
                                .replace(/ +/gi, " ")
                        ).eql(
                            result
                                .replace(/\n+/gi, " ")
                                .replace(/\t+/gi, " ")
                                .replace(/ +/gi, " ")
                        );
                    }
                    catch (e) {
                        reject(e);
                    }
                    
                    resolve(s);
                }
        
                return results;
        
            }, {queries: {}, end: false}, run.success$);
            
            run.add(code).then(function (queries) {
                run.success$({filter: queries});
            });
        });
    };*/
}

module.exports = test;