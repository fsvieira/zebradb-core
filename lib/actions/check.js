const prepare = require("../prepare");
const actionUnify = require("./unify");

function check (zvs) {
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
            
            resolve({value: {branchId, tuples: r}});
        });
    };
}

function check2merge (zvs) {
    return function ({branchId, tuples}) {
        return new Promise (function (resolve, reject) {
            const merge = [];
            
            for (var i=0; i<tuples.length; i++) {
                const {tuple, definitions} = tuples[i];
                
                const r = [];
                for (var j=0; j<definitions.length; j++) {
                    const {negation, definition} = definitions[j];
                    const unifyBranchId = actionUnify(zvs, {branchId, args: [tuple, definition]}, true);
                    
                    if (unifyBranchId) {
                        // TODO: insert negation on query,
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
            
            resolve({value: merge});
        });
    };
}

module.exports = {check, check2merge};