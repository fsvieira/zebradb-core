const utils = require("./utils");
const Sets = require("./match/sets");

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

function getVariables(zvs, branchId, q) {
    const tuples = [q];
    const done = [q];
    
    const variables = [];
    
    while (tuples.length) {
        const q = tuples.pop();
        const tuple = zvs.getData(branchId, q);
        const data = zvs.getData(branchId, tuple.data);
        
        for (let i=0; i<data.length; i++) {
            const id = zvs.branches.getDataId(branchId, data[i]);
            const v = zvs.getData(branchId, id);
            const type = zvs.getData(branchId, v.type);

            if (type === 'variable') {
                if (variables.indexOf(id) === -1) {
                    variables.push(id);
                }
            }
            else if (type === 'tuple' && done.indexOf(id) === -1) {
                done.push(id);
                tuples.push(id);
            }
        }
    }
    
    return variables;
}

function graph2string (g, sets, zvs, branchId) {
    if (Object.keys(g).length === 0) {
        return "";    
    }
    
    // http://viz-js.com/
    var r = 'digraph finite_state_machine {' +
    	        '\n\trankdir=LR;' +
            	'\n\tsize="8,5"' +
            	'\n\tnode [shape = circle];';
    
    for (let from in g) {
        const fString = sets.getSets(from).map(
            s => utils.toString(zvs.getObject(branchId, s), true)
        ).join("; ");

        const symbols = g[from];
        
        for (let symbol in symbols) {
            const symbolString = utils.toString(zvs.getObject(branchId, sets.getSymbol(symbol)), true) + ":v" + symbol;
            
            const tString = sets.getSets(symbols[symbol][0]).map(
                s => utils.toString(zvs.getObject(branchId, s), true)
            ).join("; ");
            
            r += '\n\t"' + fString + '" -> "' + tString + '" [ label = "' + symbolString + '"];';
        }
    }
    
    r += '\n}';
    
    return r;
}

function plannerAnaliser (zvs, branchId, q) {
    // We are missing negation tuples,
    const tuples = getTuples(zvs, branchId, q);
    const sets = new Sets();

    tuples.forEach(q => {
       const variables = getVariables(zvs, branchId, q);

       sets.insert(
           variables.map(v => sets.getSymbolID(v)),
           sets.getSetID(q)
       );
    });
    
    sets.deterministic();
    // console.log(graph2string(sets.transitions, sets, zvs, branchId));
    /*console.log('[' + sets.getAllSets().map(
        sets => '\t[' + sets.map(s => utils.toString(zvs.getObject(branchId, q)), true).join('; ') + ']\n')
    + ']');*/
    
    return {
        sets: sets.getAllSets(),
        tuples
    };
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

function getVariablesValues (zvs, branchId, tuples, matchTuples, match) {
    const matchVariables = {};
    
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

                if (valueType === 'variable') {
                    
                    if (tupleVariables.indexOf(valueID) === -1) {
                        tupleVariables.push(valueID);
                    }
                    
                    const v = localVariables[valueID] = localVariables[valueID] || {};
                    
                    if (defValueType === 'variable') {
                        // push variable to tuple,
                        v.variables = v.variables || [];
                        if (v.variables.indexOf(defValueID) === -1) {
                            v.variables.push(defValueID);
                        }
                    }
                    else if (defValueType === 'tuple') {
                        if (v.type) {
                            if (v.type !== defValueType) {
                                // contradiction found on this defintions, we need 
                                // to remove it,
                                definitions.splice(i, 1);
                                localVariables = undefined;
                                break;
                            }
                            else {
                                const defs = match.match(branchId, defValueID);
                                if (defs) {
                                    v.data = v.data.filter(d => defs.indexOf(d) === -1);
                                    
                                    if (v.data.length === 0) {
                                        // contradiction found on this defintions, we need 
                                        // to remove it,
                                        definitions.splice(i, 1);
                                        localVariables = undefined;
                                        break;
                                    }
                                }
                                else {
                                    // TODO: Some invalid definitions are created on multiply phase,
                                    // we should clean up all invalid definitions, and if they are user 
                                    // defined we should inform him and not run anything.
                                    definitions.splice(i, 1);
                                    localVariables = undefined;
                                    break;
                                }
                            }
                        }
                        else {
                            v.type = defValueType;
                            // add definitions,
                            v.data = match.match(branchId, defValueID);
                        }
                    }
                    else {
                        if (v.type) {
                            if (v.type !== defValueType || v.data !== defValueID) {
                                // contradiction found on this defintions, we need 
                                // to remove it,
                                definitions.splice(i, 1);
                                localVariables = undefined;
                                break;
                            }
                            // else don't do nothing, nothing changes.
                        }
                        else {
                            v.type = defValueType;
                            v.data = defValueID;
                        }
                    }
                }
            }
            
            if (localVariables) {
                // TODO: merge local variables with variables,
            }
            
        }
        // TODO: merge variables with matchVariables,
    });
    
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
