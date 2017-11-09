const utils = require("../../utils");

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

/* TODO: Try:
    1. Is loop if any if at least one of subtules unfies with their top parent,
    2. Is loop if:
        a. Match tuple with definitions, if potencial loop:
            1. check tuple data, only check elements where definition has potential loops:
                a. if variable ignore, potencial loop here but its just virtual.
                b. if constant there is no loop,
                c. if tuple repeat process (2a).
            2. this is a recursive process bubble results up and reduce them with or.
*/

function isLoop (zvs, branchId, tupleId, match) {

    let loop = false;    
    const definitions = match.match(branchId, tupleId);
    const dLoops = [];

    // check if any definition is a loop:
    for (let i=0; i<definitions.length; i++) {
        const definitionId = definitions[i];
        
        if (match.g.loops[definitionId]) {
            dLoops.push(definitionId);
        }
    }
    
    if (dLoops.length) {
        loop = true;
        
        const tuple = zvs.getData(branchId, tupleId);
        const tupleData = zvs.getData(branchId, tuple.data);
        
        for (let dl=0; dl<dLoops.length; dl++) {
            const definitionId = dLoops[dl];
            const definition = zvs.getData(branchId, definitionId);
            const definitionData = zvs.getData(branchId, definition.data);

            for (let dd=0; dd<definitionData.length; dd++) {
                const id = definitionData[dd];
                const v = zvs.getData(branchId, id);
                const type = zvs.getData(branchId, v.type);
               
                if (type === 'tuple') {
                    const tid = tupleData[dd];
                    const tv = zvs.getData(branchId, tid);
                    const ttype = zvs.getData(branchId, tv.type);
                   
                    if (ttype === 'tuple') {
                        const mt = match.match(branchId, tid);
                        const md = match.match(branchId, id);
                       
                        if (mt && md) {
                            const ms = md.filter(m => mt.indexOf(m) !== -1);
                            
                            for (let mi=0; mi<ms.length; mi++) {
                                if (match.g.loops[ms[mi]]) {
                                    loop = true;
                                    break;
                                }
                            }
                            
                            if (loop) {
                                if (isLoop(zvs, branchId, tid, match)) {
                                    return true;
                                }
                                else {
                                    loop = false;
                                }
                            }
                       }
                   }
               }
            }
        }
    }
    
    return loop;
}

function select (zvs) {
    return function (value) {
        /*
            TODO:
                - On planner phase don't send all tuples:
                    - send only single definitions tuples,
                    - send only tuples with negations on definitons,
                    - send only tuples with varibles on negations,
                    - send possible not loop tuples ...
        */
        

        /*console.log(
            "-- VALUES START --\n" +
            value.map(branches => {
                return "{" + branches.map(b => {
                    return utils.toString(zvs.getObject(b.branchId, b.tuple), true);
                }).join("\n") + "}";
            }).join("\n\n")
            + "\n-- VALUES END --\n"
        );*/
        
        return new Promise(function (resolve, reject) {
            // TODO: we should pass parend branch id from check step.
            const b = value[0][0];
            const ddata = zvs.getData(b.branchId, zvs.data.global("definitions")).data;
            const definitionsBranchId = zvs.getData(b.branchId, zvs.getData(b.branchId, ddata).branchId);
            const match = zvs.definitionsMatch[definitionsBranchId];
            
            const branch = zvs.branches.getRawBranch(b.branchId);
            const parentBranchId = branch.data.parent;
            
            const queryNegationsTotal = (
                zvs.getData(parentBranchId, zvs.getData(parentBranchId, zvs.data.global("query")).negation)
                || []
            ).length;
            
            const loops = [];
            const single = [];
            const negations = [];

            for (let vi=value.length-1; vi>=0; vi--) {
                const branches = value[vi];
                let branchNegation = false;

                let loop = false;
                for (let bi=branches.length-1; bi>=0; bi--) {
                    const b = branches[bi];

                    loop = isLoop(zvs, b.branchId, b.tuple, match);

                    if (loop === undefined) {
                        // this branch is invalid,
                        branches.splice(bi, 1);
                        if (branches.length === 0) {
                            // everything fails,
                            resolve({});
                            return;
                        } 
                    }
                    else if (loop) {
                        loops.push(branches);
                        // console.log("LOOP: " + utils.toString(zvs.getObject(b.branchId, b.tuple), true));
                        value.splice(vi, 1);
                        break;
                    }

                    if (branchNegation && branches.length > 1) {
                        // Test for negations,
                        const tupleData = zvs.getData(b.branchId, zvs.data.global("query"));
                        const negs = zvs.getData(b.branchId, tupleData.negation);
                        branchNegation = negs && negs.length > queryNegationsTotal;
                    }
                }
                
                if (!loop) {
                    if (branches.length === 1) {
                        single.push(branches);
                    }
                    else if (branchNegation) {
                        negations.push(branches);
                    }
                }
            }
            
            let branches;
            const sn = single.concat(negations);

            /*
                TODO: if sn === 0, then
                - select tuples that contain negation variables of the query.
            */
            
            if (sn.length) {
                branches = sn;
            }
            else if (value.length) {
                branches = value;
            }
            else {
                branches = loops;
            }
/*
            console.log(
            "-- SEND START --\n" +
                branches.map(branches => {
                    return "{" + branches.map(b => {
                        return utils.toString(zvs.getObject(b.branchId, b.tuple), true);
                    }).join("\n") + "}";
                }).join("\n\n")
                + "\n-- SEND END --\n"
            );*/
            branches = branches.map(m => m.map(v => v.branchId));
            resolve({value: branches});
        });
    };
}

module.exports = select;