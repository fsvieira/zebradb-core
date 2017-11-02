const utils = require("../utils");
const {getUncheckedTuples} = require('./filters');
const {getTuplesDefinitions} = require('./definitions');
const {getVariablesValues} = require('./variables/variables');

function planner (zvs, branchId, q, match) {
    // console.log(utils.toString(zvs.getObject(branchId, q), true));

    // TODO: get all uncked tuples,
    const tuples = getUncheckedTuples(zvs, branchId, q);
    
    if (tuples.length === 0) {
        return [];
    }
    
    if (!match) {
        const ddata = zvs.getData(branchId, zvs.data.global("definitions")).data;
        const definitionsBranchId = zvs.getData(branchId, zvs.getData(branchId, ddata).branchId);
        
        match = zvs.definitionsMatch[definitionsBranchId];
    }
    
    // Get tuples definitions,
    const matchTuples = getTuplesDefinitions(branchId, tuples, match);

    if (!matchTuples) {
        return;
    }

    // Get all variables values,
    const matchVariables = getVariablesValues(zvs, branchId, tuples, matchTuples, match);
    
    if (!matchVariables) {
        return;
    }

    let vreducers = [];
    for (let varID in matchVariables) {
        vreducers.push(matchVariables[varID]);
    }

    if (vreducers.length) {
        vreducers.sort((a, b) => {
            
            const rd = (a.reducers?a.reducers.length:0) - (b.reducers?b.reducers.length:0);
            
            if (rd !== 0) {
                return rd;
            }
            
            if (a.variable === b.variable) {
                const atotal = a.values.constants.length + a.values.tuples.length;
                const btotal = b.values.constants.length + b.values.tuples.length;

                return atotal - btotal;  
            }
            
            return (a.variable?1:0) - (b.variable?1:0);
        });
        
        const r = vreducers.shift();
        
        if (r.reducers && r.reducers.length) {
            return r.reducers.map(tuple => {
                return {
                    tuple,
                    definitions: matchTuples[tuple]
                };
            });
        }
        /*else {
            // extract tuples from var,
            const vtuples = (r.values.constants.concat(r.values.tuples)).reduce((acc, v) => {
                const ts = Object.keys(v.tuples).map(v => +v);
                            
                ts.forEach(t => {
                    if (acc.indexOf(t) === -1) {
                        acc.push(t);
                    }
                });        
                    
                return acc;
            }, []);

            return vtuples.map(tuple => {
                return {
                    tuple,
                    definitions: matchTuples[tuple]
                };
            });
        }*/
    }

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
