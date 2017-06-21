const should = require("should");
const utils = require("../utils");
const Session = require("../manager/manager");

function readFile (files) {
    
    return function (filename) {
        return new Promise(function (resolve, reject) {
            const file = files[filename];
            
            if (file) {
                setTimeout(function () {
                    resolve(file.data);
                }, file.delay || 0);
            }
            else {
                reject("File not found.");
            }
        });
    };
}

function trim (s) {
    return s.replace(/\n+/g, ' ')
            .replace(/\t+/g, ' ')
            .replace(/ +/g, ' ')
            .trim();
}

function test (code, result, options) {
    options = options || {};
    
    if (options.timeout) {
        this.timeout(options.timeout);
    }
    
    return function () {
        return new Promise(function (resolve, reject) {
            const session = new Session({
                readFile: readFile(options.files),
                settings: {
                    depth: options.depth
                }
            });
            
            const queries = {};
            const keys = [];
            const queryId = session.zvs.data.global("query");
            
            session.events.on('halt', function () {
                const s = [];

                for (var i=0; i<keys.length; i++) {
                    const branchQueryId = keys[i];
                    const query = session.zvs.getObject(branchQueryId, session.zvs.data.global("query"));
                    const r = queries[branchQueryId];

                    const results = [];
                    if (r.branches.length > 0) {
                        for (var j=0; j<r.branches.length; j++) {
                            const branchId = r.branches[j];
                            const qString = "\t" + utils.toString(session.zvs.getObject(branchId, queryId), true);
                            
                            if (results.indexOf(qString) === -1) {
                                results.push(qString);
                            }
                        }
                    }
                    else {
                        results.push("\t<empty>");
                    }
                    
                    s.push(
                        "?" + utils.toString(query, true) + ":\n" + 
                        results.sort().join("\n")
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
                queries[queryBranchId] = queries[queryBranchId] || {branches: [], queries: []};
            });
            
            session.events.on('success', function (branchId) {
                const queryBranchId = session.zvs.getObject(branchId, session.zvs.data.global("queryBranchId")).data;
                if (queries[queryBranchId]) {
                    queries[queryBranchId].branches.push(branchId);
                    /*
                    TODO: why is this not working, Ids should be different:
                    
                    const qID = session.zvs.getUpdatedId(branchId, queryId);
                    
                    if (queries[queryBranchId].queries.indexOf(qID) === -1) {
                        queries[queryBranchId].queries.push(qID);
                        queries[queryBranchId].branches.push(branchId);
                    }*/
                }
            });
            
            session.add({value: code});
        });
    };
}

module.exports = test;

