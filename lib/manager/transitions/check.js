const actionUnify = require("./unify");

function check (req, res) {
    const {zvs, negations} = req.context;
    const {branchId, tuples: mergeTuples} = req.args;
    
    const queryId = zvs.data.global("query");
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

                    query.negation = zvs.data.getId(qnegation.sort());
                    zvs.branches.transform(unifyBranchId, queryId, zvs.data.getId(query));
                }
                        
                // events.trigger('branch', {branchId: unifyBranchId});
                r.push({
                    branchId: unifyBranchId,
                    tuple,
                    definition
                });
            }
        }
                
        if (r.length > 0) {
            merge.push(r);
        }
        else {
            // branch fails, 
            // TODO: we need to mark branch as fail.
            res.send({});
            return;
        }
    }

    const evalNegations = merge.map(function (m) {
        const p = m.map(function ({branchId}) {
            return new Promise(function (resolve, reject) {
                negations(
                    {
                        args: {
                            branchId
                        },
                        context: req.context
                    },
                    {
                        send: resolve
                    }
                );
            });
        });
                
        return Promise.all(p).then(function (v) {
            const r = [];
                    
            for (var i=0; i<v.length; i++) {
                if (v[i].value) {
                    const mv = m[i];
                            
                    r.push({
                        branchId: v[i].value.branchId,
                        tuple: mv.tuple,
                        definition: mv.definition
                    });
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
        res.send({value: merge});
    }, function (reason) {
        res.send({});
    });
}


module.exports = {check};