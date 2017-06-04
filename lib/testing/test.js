const should = require("should");
const Z = require("../z");
const flyd = require("flyd");
const utils = require("../utils");

function test (code, result) {
    
    return function () {
        return new Promise(function (resolve, reject) {
            var run = new Z();
        
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
                        
                        s.push("?" + utils.toString(query, true) + ":\n" + 
                            results.queries[queryBranchId].map(function (branchId) {
                                return "\t" + utils.toString(zvs.getObject(branchId, zvs.data.global("query")), true);
                            }).sort().join("\n")
                        );
                    }
                    
                    try {
                        should(s.join("\n")).eql(result);
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
    };
}

module.exports = test;