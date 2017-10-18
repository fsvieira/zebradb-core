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


function planner (zvs, branchId, q) {
    // console.log(utils.toString(zvs.getObject(branchId, q), true));

    const tuples = getTuples(zvs, branchId, q);

    if (tuples.length === 0) {
        return [];
    }
    
    // get defintions branch id,
    const ddata = zvs.getData(branchId, zvs.data.global("definitions")).data;
    const definitionsBranchId = zvs.getData(branchId, zvs.getData(branchId, ddata).branchId);
    
    const match = zvs.definitionsMatch[definitionsBranchId];
    const matchTuples = {};
    
    for (var i=0; i<tuples.length; i++) {
        const tupleID = tuples[i];
        var definitions = match.match(branchId, tupleID);
        
        if (definitions && definitions.length) {
            // This all possible tuples definitions,
            const dm = matchTuples[tupleID];
            if (!dm) {
                matchTuples[tupleID] = definitions;
            }
            else {
                definitions = matchTuples[tupleID] = definitions.filter(d => dm.indexOf(d) !== -1);
            }

            const data = zvs.getData(branchId, zvs.getData(branchId, tupleID).data);
            
            var variable = false;
            
            for (var j=0; j<data.length; j++) {
                const vcode = data[j];
                const v = zvs.getData(branchId, vcode);
                const type = zvs.getData(branchId, v.type);

                if (type === 'tuple') {
                    var defs = [];
                    
                    for (var k=definitions.length-1; k>=0; k--) {
                        const dcode = zvs.getData(branchId, zvs.getData(branchId, definitions[k]).data)[j];
                        const vd = zvs.getData(branchId, dcode);
                        const dtype = zvs.getData(branchId, vd.type);

                        if (dtype === 'tuple') {
                            const d = match.match(branchId, dcode);
                            if (d) {
                                defs = d.filter(c => (defs).indexOf(c) === -1).concat(defs);
                            }
                            else {
                                definitions.splice(k, 1);
                                if (definitions.length === 0) {
                                    // fail!
                                    return;
                                }
                            }
                        }
                        else {
                            // If not a tuple then it only be a variable,
                            variable = true;
                        }
                    }

                    // If a variable was found, then all definitions are unifiable.
                    if (!variable) {
                        
                        if (defs.length === 0) {
                            // fail,
                            return;
                        }

                        const dm = matchTuples[vcode];
                        if (!dm) {
                            matchTuples[vcode] = defs;
                        }
                        else {
                            const m = matchTuples[vcode] = defs.filter(d => dm.indexOf(d) !== -1);
                            
                            if (m.length === 0) {
                                // fail,
                                return;
                            }
                            
                        }
                    }
                }
                /* TODO:
                else if (type === 'constant') {
                    
                }
                else {
                    
                }*/
            }
            
        }
        else {
            // no match for this tuples,
            return;
        }
    }
    
    const r = [];
    for (var tupleID in matchTuples) {
        r.push({
               tuple: +tupleID,
               definitions: matchTuples[tupleID]
        });
    }

    return r;
}

module.exports = planner;
