/*
    if none of negations variables are on the query than we 
    can eval negation.
*/
function canEval (zvs, branchId, tupleId, queryVariables) {
    const negationVariables = getVariables(zvs, branchId, tupleId, true);
    
    for (let i=0; i<negationVariables.length; i++) {
        const v = negationVariables[i];
        
        if (queryVariables.indexOf(v) !== -1) {
            return false;
        }
    }
    
    return true;
}

/*
    TODO: we can use this process to (and move it somewhere else):
        - get unchecked tuples,
        - get variables,
        - check for cyclic tuples.
*/

function getVariables(zvs, branchId, tupleId, processNegations) {
    tupleId = tupleId === undefined?zvs.branches.getDataId(branchId, zvs.data.global("query")):tupleId;
    const vars = [];
    
    var tuples = [tupleId];
    var all = [tupleId];
    
    while (tuples.length > 0) {
        const tupleId = tuples.pop();
        
        const tuple = zvs.getData(branchId, tupleId);
        const data = zvs.getData(branchId, tuple.data);
        
        for (let i=0; i<data.length; i++) {
            const id = zvs.branches.getDataId(branchId, data[i]);
            const v = zvs.getData(branchId, id);
            const type = zvs.getData(branchId, v.type);
            
            if (type === 'variable') {
                if (vars.indexOf(id) === -1) {
                    vars.push(id);
                }
            }
            else if (type === 'tuple' && all.indexOf(id) === -1) {
                tuples.push(id);
                all.push(id);
            }
        }
        
        if (processNegations) {
            const negations = zvs.getData(branchId, zvs.getData(branchId, tupleId).negation);
            
            if (negations && negations.length > 0) {
                negations.forEach(tupleId => {
                    tupleId = zvs.branches.getDataId(branchId, tupleId);
                    if (all.indexOf(tupleId) === -1) {
                        all.push(tupleId);
                        tuples.push(tupleId);
                    }
                });
            }
        }
    }
    
    return vars;
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

        const queryVariables = getVariables(zvs, branchId);

        for (let j=nots.length-1; j>=0; j--) {
            const tupleId = nots[j];

            if (execute || canEval(zvs, branchId, tupleId, queryVariables)) {
                nots.splice(j, 1);
                evalBranchNegations.push(exists(branchId, tupleId));
            }
        }
        
        evalAllNegations.push(
            Promise.all(evalBranchNegations).then((ids) => {
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
