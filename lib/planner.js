const utils = require("./utils");

function getTuples (zvs, branchId, q, tuples) {
    // normalize id,
    q = zvs.branches.getDataId(branchId, q);
    
    tuples = tuples || [];

    if (tuples.indexOf(q) === -1) {
        var d = zvs.getData(branchId, q);
    
        if (zvs.getData(branchId, d.type) === 'tuple') {
            if (!d.check || !zvs.getData(branchId, d.check)) {
                tuples.push(q);
            }
            
            var data = zvs.getData(branchId, d.data);
            for (var i=0; i<data.length; i++) {
                getTuples(zvs, branchId, data[i], tuples);
            }
        }
    }

    return tuples;
}

function getTuplesDefinitions (branchId, tuples, match) {
    const matchTuples = {};
    
    for (let i=0; i<tuples.length; i++) {
        const tupleID = tuples[i];
        var definitions = match.match(branchId, tupleID);
        
        if (definitions && definitions.length) {
            matchTuples[tupleID] = definitions;
        }
        else {
            return;
        }
    }
    
    return matchTuples;
}

function getRecord (branchId, match, variables, {id, type}) {
    if (type === 'variable') {
        return variables[id] = variables[id] || {variables: [id]};
    }
    
    let data = id;
    if (type === 'tuple') {
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


function getVariablesValues (zvs, branchId, tuples, matchTuples, match) {
    const matchVariables = {};
    const variableReducers = [];
    
    tuples.forEach(tupleID => {
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
                    break;
                }

                if (valueType === 'variable') {
                    if (tupleVariables.indexOf(valueID) === -1) {
                        tupleVariables.push(valueID);
                    }
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
                    const vs = variables[varID] = variables[varID] || {values: [], variable: false};

                    vs.variable = vs.variable || v.value === undefined;

                    // TODO: for now we are ignoring the equal variables, 
                    // we should handle them on the future.
                    if (v.value) {
                        const vf = vs.values.find(
                            a => {
                                if (a.value.type === v.value.type) {
                                    if (a.value.type === 'constant') {
                                        return a.value.data === v.value.data;
                                    }
                                    
                                    if (a.value.data.length === v.value.data.length) {
                                        const r = a.value.data.filter(
                                            t => v.value.data.indexOf(t) !== -1
                                        );
                                        
                                        return r.length === v.value.data.length;
                                    }
                                }
                                
                                return false;
                            }
                        );
                        
                        if (vf) {
                            const td = vf.tuples[tupleID] = vf.tuples[tupleID] || [];
                            if (td.indexOf(definitionID) === -1) {
                                td.push(definitionID);
                            }
                        }
                        else {
                            const tuples = {};
                            tuples[tupleID] = [definitionID];
                            
                            vs.values.push({
                                value: v.value,
                                tuples
                            });
                        }
                    }
                }
            }
        }
        
        /*
            Match Variables:
                1. order values by is variable (true => last), and length (greater => last)
                2. merge values a + b
            
        */
        
        // Just concat variables with matchVariables, we will merge them at the 
        // end so we can get better tuple order.
        for (let varID in variables) {
            const mt = matchVariables[varID] = matchVariables[varID] || [];
            mt.push(variables[varID]);
        }
    });

    console.log(JSON.stringify(matchVariables, null, '\t'));

    // Check resulting values
    // 1. tupleID => definitions, keep only definitions that appear on tuple*definitions values.
    // 2. update match tuples,
    return matchVariables;
}

function planner (zvs, branchId, q) {
    // console.log(utils.toString(zvs.getObject(branchId, q), true));

    // TODO: get all uncked tuples,
    const tuples = getTuples(zvs, branchId, q);
    
    if (tuples.length === 0) {
        return [];
    }
    
    const ddata = zvs.getData(branchId, zvs.data.global("definitions")).data;
    const definitionsBranchId = zvs.getData(branchId, zvs.getData(branchId, ddata).branchId);
    
    const match = zvs.definitionsMatch[definitionsBranchId];
    
    // Get tuples definitions,
    const matchTuples = getTuplesDefinitions(branchId, tuples, match);

    if (!matchTuples) {
        return;
    }

    // Get all variables values,
    const matchVariables = getVariablesValues(zvs, branchId, tuples, matchTuples, match);

    let reducers = [];

    tuples.forEach(tupleID => {
        const mt = matchTuples[tupleID];
        const tuple = zvs.getData(branchId, tupleID);
        const data = zvs.getData(branchId, tuple.data);
    
        for (let i=0; i<data.length; i++) {
            const tID = zvs.branches.getDataId(branchId, data[i]);
            const v = zvs.getData(branchId, tID);
            const vType = zvs.getData(branchId, v.type);
            
            if (vType === 'variable') {
                matchVariables[tID] = [];
                
                for (let j=mt.length-1; j>=0; j--) {
                    const d = mt[j];
                    const tuple = zvs.getData(branchId, d);
                    const data = zvs.getData(branchId, tuple.data);
                                
                    const di = data[i];

                    /*
                        TODO:
                            - if data constant, just save it.
                            - if is tuple, get match defintions (for comparing other tuples).
                            - if variable save locsl to check if it gets any value,
                                * we need to run all tuple until end to do this ...
                            - if variable doens't unify with any value, save variable itself. 
                    */

                    matchVariables[tID].push({
                        father: tupleID,
                        definition: d,
                        data: di
                    });
                }
            }
            else if (vType === 'tuple') {
                const tmt = matchTuples[tID];

                // Checked tuples will not appear on matchTuples, and so we can 
                // ignore them. 
                if (tmt) {
                    let defs = [];
                    
                    for (let j=mt.length-1; j>=0; j--) {
                        const d = mt[j];
                        const tuple = zvs.getData(branchId, d);
                        const data = zvs.getData(branchId, tuple.data);
                            
                        const di = data[i];
                        const diTuple = zvs.getData(branchId, di);
                            
                        const type = zvs.getData(branchId, diTuple.type);
                            
                        if (type === 'tuple') {
                            const mdi = match.match(branchId, di);
                            if (mdi) {
                                mdi.forEach(t => {
                                    if (defs.indexOf(t) === -1) {
                                        defs.push(t);
                                    }
                                });
                            }
                            else {
                                // remove definition, it can't unify with this.
                                // This is not a reducers because unfication 
                                // order doens't have anything to do with this.
                                mt.splice(j, 1);
                            }
                        }
                        else if (type === 'variable') {
                            defs = tmt;
                            break;
                        }
                    }
    
                    for (let j=tmt.length; j>=0; j--) {
                        if (defs.indexOf(tmt[j]) === -1) {
                            // remove element,
                            if (reducers.indexOf(tupleID) === -1) {
                                reducers.push(tupleID);
                            }
    
                            tmt.splice(j, 1);
                        }
                    }
    
                    if (tmt.length === 0) {
                        // The tuple fails to unify with anything,
                        return;
                    }
                }
            }
        }
    });

    reducers = reducers.filter(s => {
        for (let i=0; i<matchTuples[s].length; i++) {
            const definitions = matchTuples[s];
            
            for (let j=0; j<definitions.length; j++) {
                const definition = definitions[j];
                
                if (match.g.loops[definition]) {
                    return false;
                }
            }
        }
        
        return true;
    });

    const r = reducers.length?reducers:tuples;
    
    return r.map(tuple => {
        return {
            tuple,
            definitions: matchTuples[tuple]
        };
    });
}

module.exports = planner;
