/*
    TODO:
        * take negations into analise.
*/
function select (zvs) {
    function getVariables (branchId, tupleId) {
        const variables = [];
        const tuples = [tupleId];

        do {
            const tId = tuples.pop();
            const tuple = zvs.getData(branchId, tId);
            const data = zvs.getData(branchId, tuple.data);

            for (let i=0; i<data.length; i++) {
                const id = data[i];
                const value = zvs.getData(branchId, id);
                const type = zvs.getData(branchId, value.type);
                
                if (type === 'variable') {
                    if (variables.indexOf(id) === -1) {
                        variables.push(id);
                    }
                }
                else if (type === 'tuple') {
                    if (tuples.indexOf(id) === -1) {
                        tuples.push(id);
                    }
                }
            }
        } while (tuples.length);
        
        return variables;
    }

    return function (value) {
        return new Promise(function (resolve, reject) {
            const single = [];

            for (let i=0; i<value.length; i++) {
                const v = value[i];
                
                if (v.length === 1) {
                    single.push(v);
                    value.splice(i, 1);
                }
            }
            
            if (single.length) {
                const branches = single.map(m => m.map(v => v.branchId));
                resolve({value: branches});
                return;
            }

            /*
            value.map(branches => {
                // For each array of tuples there should be only one
                // tupleId and parentBranchId
                const b = branches[0];
            
                const branch = zvs.branches.getRawBranch(b.branchId);
                const parentBranchId = branch.data.parent;
                const tupleId = b.tuple;
    
                const variables = getVariables(parentBranchId, tupleId);
                    
                // console.log(JSON.stringify(variables, null, '\t'));
                // console.log(JSON.stringify(branch, null, '\t'));
                // console.log(JSON.stringify(b, null, '\t'));
            });*/
            
            const branches = value.map(m => m.map(v => v.branchId));
            resolve({value: branches});
        });
    };
}

module.exports = select;