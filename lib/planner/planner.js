const utils = require("../utils");
const {getUncheckedTuples} = require('./filters');
const {getTuplesDefinitions} = require('./definitions');

function planner (zvs, branchId, q, match) {
    // console.log("QUERY: " + utils.toString(zvs.getObject(branchId, q), true));

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

    // restrict tuple definitions,
    tuples.forEach(tupleID => {
        const mt = matchTuples[tupleID];
        const tuple = zvs.getData(branchId, tupleID);
        const data = zvs.getData(branchId, tuple.data);
    
        for (let i=0; i<data.length; i++) {
            const tID = zvs.branches.getDataId(branchId, data[i]);
            const v = zvs.getData(branchId, tID);
            const vType = zvs.getData(branchId, v.type);
            
            if (vType === 'tuple') {
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

    return tuples.map(tuple => {
        return {
            tuple,
            definitions: matchTuples[tuple]
        };
    });
}

module.exports = planner;
