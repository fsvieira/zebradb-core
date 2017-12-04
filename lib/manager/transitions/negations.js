
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
        else {
            res.send({value: {branches}});
        }
        return;
    }
    
    const execute = branchId !== undefined;

    const evalAllNegations = [];

    for (let i=0; i<negs.length; i++) {
        const {branchId, negations: nots, branches} = negs[i];
        const evalBranchNegations = [];

        for (let j=0; j<nots.length; j++) {
            const tupleId = nots[j];

            if (execute || !hasVariables(zvs, branchId, tupleId)) {
                // execute tupleId,
                // evalBranchNegations.push(runQuery(zvs, events, branchId, tupleId, abort));
                evalBranchNegations.push(exists(branchId, tupleId));
            }
        }
        
        evalAllNegations.push(
            Promise.all(evalBranchNegations).then(() => {
                // Everything is ok,
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
        else {
            res.send({value: {branches}});
        }        
    }, () => {
        res.send({});
    });
}

module.exports = negations;
