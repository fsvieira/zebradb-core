const prepare = require("../../prepare");
const actionUnify = require("./unify");

function check (zvs, neg, events) {
    const queryId = zvs.data.global("query");

    return function ({branchId, tuples}) {
        return new Promise(function (resolve, reject) {
            var defs = zvs.getObject(branchId, zvs.data.global("definitions")).data.definitions;
            var r = [];
            
            for (var i=0; i<tuples.length; i++) {
                const tuple = tuples[i];
                const virtual = zvs.getObject(branchId, tuple).virtual;
                var tupleDefs;
                
                if (virtual) {
                    tupleDefs = defs.filter(function (d) {
                       var code = d.virtual.code;
                       
                       return virtual.transitions.indexOf(code) !== -1;
                    });
                }
                else {
                     tupleDefs = defs.slice(0);
                }
            
                var t = [];
                for (var j=0; j<tupleDefs.length; j++) {
                    var c = prepare.copyWithVars(
                        tupleDefs[j],
                        function () {
                            return zvs.branches.getUniqueId(branchId);
                        }
                    );

                    var negation = c.negation;
                    
                    delete c.negation;
                    var def = zvs.data.add(c);
                    
                    t.push({
                        negation: negation,
                        definition: def
                    });
                    
                }
                
                r.push({
                    tuple,
                    definitions: t
                });
            }
            
            const mergeTuples = r;
            // resolve({value: {branchId, tuples: r}});
            // Check 2 merge,
            const merge = [];

            for (var i=0; i<mergeTuples.length; i++) {
                const {tuple, definitions} = mergeTuples[i];
                const r = [];
                
                for (var j=0; j<definitions.length; j++) {
                    const {negation, definition} = definitions[j];
                    const unifyBranchId = actionUnify(zvs, {branchId, args: [tuple, definition]}, false);
                    
                    if (unifyBranchId) {
                        if (negation && negation.length > 0) {
                            const query = Object.assign({}, zvs.getData(unifyBranchId, queryId)); 
                            const qnegation = zvs.getData(unifyBranchId, query.negation).slice(0);
                            
                            for (var n=0; n<negation.length; n++) {
                                const nId = zvs.data.add(negation[n]);
                                
                                if (qnegation.indexOf(nId) === -1) {
                                    qnegation.push(nId);
                                }
                            }

                            query.negation = zvs.data.dataHash(qnegation.sort());
                            zvs.branches.transform(unifyBranchId, queryId, zvs.data.dataHash(query));
                        }
                        
                        events.trigger('branch', {branchId: unifyBranchId});
                        r.push(unifyBranchId);
                    }
                }
                
                if (r.length > 0) {
                    merge.push(r);
                }
                else {
                    // branch fails, 
                    // TODO: we need to mark branch as fail.
                    resolve({});
                    return;
                }
            }

            const evalNegations = merge.map(function (m) {
                const p = m.map(function (branchId) {
                    return neg({branchId});
                });
                
                return Promise.all(p).then(function (v) {
                    const r = [];
                    
                    for (var i=0; i<v.length; i++) {
                        if (v[i].value) {
                            r.push(v[i].value.branchId);
                        }
                    }
                    
                    if (r.length) {
                        return r;
                    }
                    else {
                        return Promise.reject("empty results");
                    }
                });
            });
            
            Promise.all(evalNegations).then(function (merge) {
                /*merge.forEach(function (branches) {
                    branches.forEach(function (branchId) {
                        // update all objects,
                        zvs.getUpdatedId(branchId, queryId);
                    });
                });*/

                resolve({value: merge});    
            }, function (reason) {
                resolve({});
            });
            
        });
    };
}


module.exports = {check};