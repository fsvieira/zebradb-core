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
            const session = new Session({});
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
}

module.exports = test;

