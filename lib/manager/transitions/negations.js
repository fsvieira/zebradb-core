
const utils = require("../../utils");

function hasVariables (zvs, branchId, tupleId) {
    const tuples = [tupleId];
    var all = [];
    
    while (tuples.length > 0) {
        const tupleId = tuples.pop();
        
        const tuple = zvs.getData(branchId, tupleId);
        const data = zvs.getData(branchId, tuple.data);
        
        for (let i=0; i<data.length; i++) {
            const id = data[i];
            const v = zvs.getData(branchId, id);
            const type = zvs.getData(branchId, v.type);
            
            if (type === 'variable') {
                return true;
            }
            else if (type === 'tuple' && all.indexOf(id) === -1) {
                tuples.push(id);
                all.push(id);
            }
        }
    }
    
    return false;
}

function negations (req, res) {
    const {zvs, exists} = req.context;
    const {branches, negations: negs, branchId} = req.args;

    if (negs.length === 0) {
        if (branchId) {
            res.send({value: {branchId}});
        }
        else if (branches.length > 1) {
            res.send({value: {branches}});
        }
        else {
            res.send({values: branches[0]});
        }
        
        return;
    }
    
    const execute = branchId !== undefined;

    const evalAllNegations = [];

    for (let i=0; i<negs.length; i++) {
        const {branchId, negations: nots, branches} = negs[i];
        const evalBranchNegations = [];

        for (let j=nots.length-1; j>=0; j--) {
            const tupleId = nots[j];

            if (execute || !hasVariables(zvs, branchId, tupleId)) {
                // execute tupleId,
                // evalBranchNegations.push(runQuery(zvs, events, branchId, tupleId, abort));
                nots.splice(j, 1);
                evalBranchNegations.push(exists(branchId, tupleId));
            }
        }
        
        evalAllNegations.push(
            Promise.all(evalBranchNegations).then((ids) => {
                // Everything is ok,
                /*const ns = zvs.getObject(branchId, zvs.getData(branchId, zvs.data.global("query")).negation);

                // update negations,
                zvs.update(branchId, zvs.data.global("query"), {
                    negation: ns
                });*/
                
                return true;
            }, () => {
                // at least one of negations has failed, we need to remove branch,
                const index = branches.indexOf(branchId);
                branches.splice(index, 1);
                
                if (branches.length === 0) {
                    return Promise.reject();
                }
                
                return Promise.resolve();
            })
        );
    }
    
    Promise.all(evalAllNegations).then(() => {
        if (branchId) {
            res.send({value: {branchId}});
        }
        else if (branches.length > 1) {
            res.send({value: {branches}});
        }
        else {
            res.send({values: branches[0]});
        }
    }, () => {
        res.send({});
    });
}

module.exports = negations;
