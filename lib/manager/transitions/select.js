/*
    TODO:
        * take negations into consideration.
*/

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

function __isLoop (zvs, branchId, tupleId, match) {
    const tuples = [tupleId];
    const done = [tupleId];
    
    while (tuples.length) {
        const tupleId = tuples.pop();
        const definitions = match.match(branchId, tupleId);
        
        if (!definitions) {
            // this tuple is invalid,
            return;
        }
        
        const tuple = zvs.getData(branchId, tupleId);
        const tupleData = zvs.getData(branchId, tuple.data);
            
        for (let di=0; di<definitions.length; di++) {
            const definitionId = definitions[di];

            if (match.g.loops[definitionId]) {
                const definition = zvs.getData(branchId, definitionId);
                const ddata = zvs.getData(branchId, definition.data);

                for (let ti=0; ti < tupleData.length; ti++) {
                    const id = tupleData[ti];
                    const v = zvs.getData(branchId, id);
                    const type = zvs.getData(branchId, v.type);
                        
                    if (type === 'tuple') {
                        if (done.indexOf(id) === -1) {
                            done.push(id);
                            tuples.push(id);
                        }
                    }
                    else if (type === 'variable') {
                        const tid = ddata[ti];
                        const tv = zvs.getData(zvs.branches.root, tid);
                        const type = zvs.getData(zvs.branches.root, tv.type);
                        
                        if (type === 'tuple') {
                            const m = match.match(branchId, tid);
                            
                            if (!m) {
                                // this tuple is invalid,
                                return; 
                            }
                            
                            for (let mi=0; mi<m.length; mi++) {
                                if (match.g.loops[m[mi]]) {
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    return false;
}


function select (zvs) {
    return function (value) {

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
            
            /*
                TODO: if query has negations and there is no new negations on tuple branches, 
                we should try to solve query negations by sending tuples with variable values that appear 
                on negation.
            */
            const queryNegationsTotal = (
                zvs.getData(parentBranchId, zvs.getData(parentBranchId, zvs.data.global("query")).negation)
                || []
            ).length;
            
            const loops = [];
            const single = [];
            const negations = [];
            
            /*
                TODO we need a better way to find loops:
                - on definitions mark variables that are potencial loops,
                - the loop will disappier when variable gets a value,
                - a tuple is a loop if it contains a loop variable.
            */

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

function __select (zvs) {
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
            
                if (variables.length) {
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
                            
                            const vid = zvs.branches.getDataId(branchId, v);
                            const value = zvs.getData(branchId, vid);
                            const type = zvs.getData(branchId, value.type);
                            
                            if (type === 'constant') {
                                if (lv.constants.indexOf(vid) === -1) {
                                    lv.constants.push(vid);
                                }
                            }
                            else if (type === 'tuple') {
                                const mv = match.match(branchId, vid);
                                
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
                const close = value.filter(v => result.indexOf(v) === -1).map(m => m.map(v => v.branchId));
            
                close.forEach(branches => 
                    branches.forEach(
                        branchId => 
                            zvs.branches.end({
                                branchId,
                                // TODO: this is not really a fail, its a close but no childs.
                                fail: true,
                                reason: "Planner discard of branch."
                            }
                        )
                    )
                );
            }
            
            const branches = (result.length?result:value).map(m => m.map(v => v.branchId));
            resolve({value: branches});
        });
    };
}

module.exports = select;