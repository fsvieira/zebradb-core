
function normalize (value, variables) {
    variables = variables || {
        table: {},
        ids: 1
    };

    value = Object.assign({}, value);

    switch (value.type) {
        case 'tuple':
            value.data = value.data.map(v => {
                return normalize(v, variables);
            });

            if (value.negations && value.negations.length) {
                value.negations = value.negations.map(v => {
                    return normalize(v, variables);
                }).sort(compareTuples);
            }
            break;
            
        case 'variable':
            var vid;
            if (value.data && value.data !== '') {
                vid = variables.table[value.id] = variables.table[value.id] || variables.ids++;
            }
            else {
                vid = variables.ids++;
            }
            
            value.data = vid;
            value.id = undefined;
            break;
    }
    
    return value;
}

function compareTuples (a, b) {
    const typeCompare = a.type.localeCompare(b);
    if (typeCompare === 0) {
        switch (a.type) {
            case 'constant':
                return a.data.localeCompare(b.data);
            case 'variable':
                return a.data - b.data;
            case 'tuple':
                if (a.data.length === b.length 
                    && (a.negations?a.negations.length:0) === (b.negations?b.negations.length:0) 
                ) {
                    for (var i=0; i<a.data.length; i++) {
                        const c = compareTuples(a.data[i], b.data[i]);
                        if (c !== 0) {
                            return c;
                        }
                    }

                    if (a.negations) {                    
                        for (var i=0; i<a.negations.length; i++) {
                            const c = compareTuples(a.negations[i], b.negations[i]);
                            if (c !== 0) {
                                return c;
                            }
                        }
                    }                    
                }
                else {
                    return a.data.length - b.length;
                }

        }
    }
    
    return typeCompare;
}

function find (tuple, tuples) {
    for (var i=0; i<tuples.length; i++) {
        if (compareTuples(tuple, tuples[i].solution) === 0) {
            return i;
        }
    }
    
    return -1;
}

function success (zvs, events) {
    const solutions = {};
    
    // TODO: remove branch solutions that are no longer active, use track events.
    
    return function (value) {
        return new Promise((resolve, reject) => {
            const queryBranchId = zvs.getObject(value.branchId, zvs.data.global("queryBranchId")).data;
            const tuple = zvs.getObject(value.branchId, zvs.data.global("query"));
            const tuples = solutions[queryBranchId] = solutions[queryBranchId] || [];
        
            if (find(tuple, tuples) === -1) {
                // If tuple is not yet on solutions,
                solutions[queryBranchId].push({
                    branchId: value.branchId,
                    solution: normalize(tuple)
                });
            
                zvs.branches.end({
                    rootBranchId: queryBranchId,
                    branchId: value.branchId, 
                    success: true
                });
            
                events.trigger("success", value.branchId);
            }

            resolve({});
        });
    };
}

module.exports = success;
