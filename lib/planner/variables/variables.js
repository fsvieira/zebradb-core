const utils = require('../../utils');
const {
    sortTotalValues,
    total,
    extractReducers
} = require("./utils");

function getRecord (branchId, match, variables, {id, type}) {
    if (type === 'variable') {
        return variables[id] = variables[id] || {variables: [id]};
    }
    
    let data = id;
    if (type === 'tuple') {
        // TODO: replace variables by their values before the match. 
        for (let i in variables) {
            console.log(i + " = " + JSON.stringify(variables[i].value) + " => ");
        }
        
        data = match.match(branchId, id);
        
        if (!data) {
            return;
        }
    }
    
    return {
        value: {
            type: type,
            data: data,
        },
        variables: []
    };
}

function merge (ra, rb) {

    // variables union,
    ra.variables = ra.variables.concat(
        rb.variables.filter(v => ra.variables.indexOf(v) === -1)
    );
    
    if (ra.value && rb.value) {
        // we need to merge both values,
        if (ra.value.type === rb.value.type) {
            
            if (ra.value.type === 'constant') {
                if (ra.value.data !== rb.value.data) {
                    // value can't be merged,
                    return;
                }
            }
            else {
                ra.value.data = ra.value.data.filter(
                    v => rb.value.data.indexOf(v) !== -1
                );
                
                if (ra.value.data.length === 0) {
                    // value can't be merged,
                    return;
                }
            }
        }
        else {
            // value can't be merged,
            return;
        }
    }
    else {
        ra.value = ra.value || rb.value;
    }
    
    return ra;
}

function defer (branchId, match, variables, a, b) {
    
    const ra = getRecord(branchId, match, variables, a);
    
    if (!ra) {
        return;
    }
    
    const rb = getRecord(branchId, match, variables, b);
    
    if (!rb) {
        return;
    }
    
    // now that we have value normalization, we can merge them.
    const m = merge(ra, rb);
    
    if (m) {
        for (let i=0; i<m.variables.length; i++) {
            const id = m.variables[i];
            
            variables[id] = m;
        }
    }
    
    return m;
}


function matchVariablesValues (
    zvs,
    branchId,
    tupleData,
    definitionData,
    j,
    i,
    match,
    localVariables,
    definitions,
    tupleVariables
) {
    const valueID = zvs.branches.getDataId(branchId, tupleData[j]);
    const value = zvs.getData(branchId, valueID);
    const valueType = zvs.getData(branchId, value.type);
                
    const defValueID = zvs.branches.getDataId(branchId, definitionData[j]);
    const defValue = zvs.getData(branchId, defValueID);
    const defValueType = zvs.getData(branchId, defValue.type);

    const r = defer(
        branchId, match, localVariables, 
        {
            id: valueID,
            type: valueType
        },
        {
            id: defValueID,
            type: defValueType
        }
    );
                    
    if (!r) {
        definitions.splice(i, 1);
        localVariables = undefined;
        return;
    }

    if (valueType === 'variable') {
        if (tupleVariables.indexOf(valueID) === -1) {
            tupleVariables.push(valueID);
        }
    }
    
    return localVariables;
}

function getTupleVariablesValues (zvs, branchId, tupleID, match, matchTuples, matchVariables) {
    // console.log(utils.toString(zvs.getObject(branchId, tupleID)));
    
    const tuple = zvs.getData(branchId, tupleID);
    const tupleData = zvs.getData(branchId, tuple.data);

    // Save this tuple possible variable values,
    const variables = {};
    const definitions = matchTuples[tupleID];

    for (let i=definitions.length-1; i>=0; i--) {
            
        // We are going to store local variables, to be able to defer
        // variables values.
        let localVariables = {};
        const tupleVariables = [];

        const definitionID = definitions[i];
        const definition = zvs.getData(branchId, definitionID);
        const definitionData = zvs.getData(branchId, definition.data);

        for (let j=0; j<tupleData.length; j++) {
            localVariables = matchVariablesValues (
                zvs,
                branchId,
                tupleData,
                definitionData,
                j,
                i,
                match,
                localVariables,
                definitions,
                tupleVariables
            );
                
            if (!localVariables) {
                break;
            }
        }

        if (tupleVariables.length === 0) {
            // this tuple doesn't have any variables,
            break;
        }
                
        if (localVariables) {
            // 1. merge local variables with variables.
            for (let j=0; j<tupleVariables.length; j++) {
                const varID = tupleVariables[j];
                const v = localVariables[varID];
                    
                // if v doesnt have a value it is still a variable and 
                // it can unify with anything,

                v.variables = v.variables.filter(v => tupleVariables.indexOf(v) !== -1);
                    
                const vs = variables[varID] = variables[varID] || {values: {
                    constants: [],
                    tuples: []
                }, variable: false};

                vs.variable = vs.variable || v.value === undefined;

                // TODO: for now we are ignoring the equal variables, 
                // we should handle them on the future.
                if (v.value) {
                    if (v.value.type === 'constant') {
                        const cf = vs.values.constants.find(c => c.value === v.value.data);
                            
                        if (cf) {
                            const ct = cf.tuples[tupleID] = cf.tuples[tupleID] || [];
                            if (ct.indexOf(definitionID) === -1) {
                                ct.push(definitionID);
                            }
                        }
                        else {
                            const tuples = {};

                            tuples[tupleID] = [definitionID];

                            vs.values.constants.push({
                                value: v.value.data,
                                tuples
                            });
                        }
                    }
                    else {
                        for (let k=0; k<v.value.data.length; k++) {
                            const value = v.value.data[k];
                            const tf = vs.values.tuples.find(c => c.value === value);
                                
                            if (tf) {
                                const td = tf.tuples[tupleID] = tf.tuples[tupleID] || [];

                                if (td.indexOf(definitionID) === -1) {
                                    td.push(definitionID);
                                }
                            }
                            else {
                                const tuples = {};
                                tuples[tupleID] = [definitionID];
                                    
                                vs.values.tuples.push({
                                    value,
                                    tuples
                                });
                            }
                        }
                    }
                }
            }
        }
    }
        
    // Just concat variables with matchVariables, we will merge them at the 
    // end so we can get better tuple order.
    for (let varID in variables) {
        const mt = matchVariables[varID] = matchVariables[varID] || [];
        mt.push(variables[varID]);
    }
}

function getVariablesValues (zvs, branchId, tuples, matchTuples, match) {
    const matchVariables = {};

    tuples.forEach(tupleID => 
        getTupleVariablesValues(zvs, branchId, tupleID, match, matchTuples, matchVariables)
    );

    // console.log(JSON.stringify(matchVariables, null, '\t'));

    for (let varID in matchVariables) {
        sortTotalValues(matchVariables[varID]);
        
        const mv = matchVariables[varID];
        
        const r = mv.pop();
        while (mv.length) {
            const a = mv.pop();
            
            if (r.variable) {
                // concat,
                for (let i=r.values.tuples.length-1; i>=0; i--) {
                    const t = r.values.tuples[i];
                    const av = a.values.tuples.find(a => a.value === t.value);
                    
                    if (av) {
                        for (let tupleID in av.tuples) {
                            const ts = t.tuples[tupleID] = t.tuples[tupleID] || [];
                            av.tuples[tupleID].forEach(at => {
                               if (ts.indexOf(at) === -1) {
                                   ts.push(at);
                               }
                            });
                        }
                    }
                    else {
                        r.values.tuples.push(av);
                    }
                }
                
                for (let i=r.values.constants.length-1; i>=0; i--) {
                    const t = r.values.constants[i];
                    const av = a.values.constants.find(a => a.value === t.value);
                    
                    if (av) {
                        for (let tupleID in av.tuples) {
                            const ts = t.tuples[tupleID] = t.tuples[tupleID] || [];
                            av.tuples[tupleID].forEach(at => {
                               if (ts.indexOf(at) === -1) {
                                   ts.push(at);
                               }
                            });
                        }
                    }
                    else {
                        r.values.constants.push(av);
                    }
                }
                
                r.variable = r.variable && a.variable;
            }
            else if (!a.variable) {
                // intersect,
                
                const rtotal = total(r);
                
                for (let i=r.values.tuples.length-1; i>=0; i--) {
                    const t = r.values.tuples[i];
                    const av = a.values.tuples.find(a => a.value === t.value);
                    
                    if (av) {
                        for (let tupleID in av.tuples) {
                            const ts = t.tuples[tupleID] = t.tuples[tupleID] || [];
                            av.tuples[tupleID].forEach(at => {
                               if (ts.indexOf(at) === -1) {
                                   ts.push(at);
                               }
                            });
                        }
                    }
                    else {
                        r.values.tuples.splice(i, 1);
                    }
                }
                
                for (let i=r.values.constants.length-1; i>=0; i--) {
                    const t = r.values.constants[i];
                    const av = a.values.constants.find(a => a.value === t.value);
                    
                    if (av) {
                        for (let tupleID in av.tuples) {
                            const ts = t.tuples[tupleID] = t.tuples[tupleID] || [];
                            av.tuples[tupleID].forEach(at => {
                               if (ts.indexOf(at) === -1) {
                                   ts.push(at);
                               }
                            });
                        }
                    }
                    else {
                        r.values.constants.splice(i, 1);
                    }
                }

                const ftotal = total(r);

                if (ftotal === 0) {
                    // This will fail, has variable can't get any valid values or be undefined.
                    return;
                }

                if (ftotal < rtotal) {
                    r.reducers = extractReducers(r.reducers, a);
                }
                else if (ftotal < total(a)) {
                    // insert r has a reducer,
                    r.reducers = extractReducers(r.reducers, r);
                }
            }
        }
        
        matchVariables[varID] = r;
    }

    // console.log(JSON.stringify(matchVariables, null, '\t'));

    return matchVariables;
}

module.exports = {
    getVariablesValues
};