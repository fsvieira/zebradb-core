/*
    TODO:
        * take negations into consideration.
*/

let total = function (a) {
    return a.constants.length + a.tuples.length;
};

let sortValues = function (values) {
    values.sort((a, b) => {
        if (a.variable === b.variable) {
            const atotal = total(a);
            const btotal = total(b);
                    
            return btotal - atotal;       
        }
                
        return (b.variable?1:0) - (a.variable?1:0);
    });
    
    return values;
};

"#if DEBUG";
    const {contractFunc} = require('../../testing/contracts');
    
    sortValues = contractFunc(sortValues, 'sortTotalValues', {
        post: (values) => {
            let i=0, min=Infinity;
            for (i=0; i<values.length; i++) {
                const value = values[i];
                if (!value.variable) {
                    break;
                }
                
                const t = total(values[i]);
                if (total(values[i]) <= min) {
                    min = t;
                }
                else {
                    return "Found variables incresing value at position " + i + ", of " + JSON.stringify(values);
                }
            }
            
            min = Infinity;
            for (; i<values.length; i++) {
                const value = values[i];
                
                if (value.variable) {
                    return "Found variable on values at position " + i + ", of " + JSON.stringify(values);
                }
                
                const t = total(values[i]);
    
                if (total(values[i]) <= min) {
                    min = t;
                }
                else {
                    return "Found values incresing value at position " + i + ", of " + JSON.stringify(values);
                }
            }
        }
    });
    
    total = contractFunc (total, 'total', {
        pre: (v) => {
            if ( !(v.constants instanceof Array) ) {
                return "Invalid value constants " + JSON.stringify(v) + ".";
            }

            if ( !(v.tuples instanceof Array) ) {
                return "Invalid value tuples " + JSON.stringify(v) + ".";
            }
        }
    });
    
"#endif";

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
            /*
            const single = [];

            for (let i=0; i<value.length; i++) {
                const v = value[i];
                
                if (v.length === 1) {
                    single.push(v);
                    value.splice(i, 1);
                }
            }*/
            
            /*if (single.length) {
                const branches = single.map(m => m.map(v => v.branchId));
                resolve({value: branches});
                return;
            }*/

            const constants = [];
            const variableValues = {};

            for (let i=value.length-1; i>=0; i--) {
                const branches = value[i];
                const b = branches[0];
                const branch = zvs.branches.getRawBranch(b.branchId);
                const parentBranchId = branch.data.parent;
                const tupleId = b.tuple;
    
                const variables = getVariables(parentBranchId, tupleId);

                const ddata = zvs.getData(parentBranchId, zvs.data.global("definitions")).data;
                const definitionsBranchId = zvs.getData(parentBranchId, zvs.getData(parentBranchId, ddata).branchId);
                const match = zvs.definitionsMatch[definitionsBranchId];
            
                if (variables.length === 0) {
                    constants.push(branches);
                }
                else {
                    const localValues = {};
                    for (let j=branches.length-1; j>=0; j--) {
                        const b = branches[j];
                        const branchId = b.branchId;
                        
                        for (let v of variables) {
                            const lv = localValues[v] = localValues[v] || {
                                constants: [],
                                tuples: [],
                                branches,
                                variable: false
                            };
                            
                            const vv = variableValues[v] = variableValues[v] || [];
                            if (vv.indexOf(lv) === -1) {
                                vv.push(lv);
                            }
                            
                            const value = zvs.getData(branchId, v);
                            const type = zvs.getData(branchId, value.type);
                            
                            if (type === 'constant') {
                                if (lv.constants.indexOf(v) === -1) {
                                    lv.constants.push(v);
                                }
                            }
                            else if (type === 'tuple') {
                                const mv = match.match(branchId, v);
                                
                                if (mv) {
                                    mv.forEach(m => {
                                        if (lv.tuples.indexOf(m) === -1) {
                                            lv.tuples.push(m);
                                        }
                                    });
                                }
                                else {
                                    branches.splice(j, 1);
                                    if (branches.length === 0) {
                                        resolve({});
                                        return;
                                    }
                                }
                            }
                            else {
                                // doesn't get any value, so it can be anything.
                                lv.variable = true;
                            }
                        }
                    }
                }
            }
            
            
            const result = [];
            for (let v in variableValues) {
                const values = sortValues(variableValues[v]);
                
                const r = values.pop();
                
                while (values.length) {
                    const rv = values.pop();
                    const rtotal = total(r);
                    
                    if (r.variable) {
                        r.constants = r.constants.concat(rv.constants.filter(c => r.constants.indexOf(c) === -1));
                        r.tuples = r.tuples.concat(rv.tuples.filter(t => r.tuples.indexOf(t) === -1));
                        
                        r.variable = r.variable && rv.variable;
                    }
                    else if (!rv.variable) {
                        r.constants = r.constants.filter(c => rv.constants.indexOf(c) !== -1);
                        r.tuples = r.tuples.filter(t => rv.tuples.indexOf(t) !== -1);
                    }
                    
                    const ftotal = total(r);
                    
                  if (ftotal === 0 && !r.variable) {
                        resolve({});
                        return;
                    }
                    else if (rtotal < ftotal) {
                        r.reducers = r.reducers || [];
                        if (r.reducers.indexOf(rv.branches) === -1) {
                            r.reducers.push(rv.branches);    
                        }
                    }
                    else if (ftotal < total(rv)) {
                        r.reducers = r.reducers || [];
                        if (r.reducers.indexOf(r.branches) === -1) {
                            r.reducers.push(r.branches);
                        }
                    }
                    
                }
                
                if (r.reducers) {
                    r.reducers.forEach(r => {
                        if (result.indexOf(r) === -1) {
                            result.push(r);
                        }
                    });
                }
            }

            for (let i=0; i<value.length; i++) {
                const v = value[i];
                
                if (v.length === 1 && result.indexOf(v) === -1) {
                    result.push(v);
                }
            }
            
            if (result.length) {
                const branches = result.map(m => m.map(v => v.branchId));
                resolve({value: branches});
                return;
            }

            const branches = value.map(m => m.map(v => v.branchId));
            resolve({value: branches});
        });
    };
}

module.exports = select;