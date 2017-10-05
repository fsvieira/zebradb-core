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

function getVariables (zvs, branchId, tupleId) {
    
    const tuple = zvs.getData(branchId, tupleId);
    const variables = [];
    const data = zvs.getData(branchId, tuple.data);
    
    for (var i=0; i< data.length; i++) {
        const valueId = zvs.branches.getDataId(branchId, data[i]);
        const value = zvs.getData(branchId, valueId);
        
        if (zvs.getData(branchId, value.type) === 'variable') {
            if (variables.indexOf(valueId) === -1) {
                // Store unonimous variables,
                variables.push(valueId);
            }
        }
    }
    
    return variables;
}

/*
function getVariables (tuple, id, variables) {
    
    var tuples = [tuple];
    
    while (tuples.length) {
        tuple = tuples.pop();
        
        if (tuple.type === 'tuple') {
            for (var i=0; i<tuple.data.length; i++) {
                var t = tuple.data[i];
                
                if (t.type === 'tuple') {
                    tuples.push(t);
                }
                else if (t.type === 'variable' && t.data && t.data.length) {
                    variables[t.id] = variables[t.id] || [];
                    variables[t.id].push(id);
                }
            }
        }
        
        if (tuple.negation) {
            tuples = tuples.concat(tuple.negation);
        }
    }
}


function shuffle (array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}


// --- Planners ---
function planner_all (zvs, branchId, q) {
    const tuples = getTuples(zvs, branchId, q);
    
    // get defintions branch id,
    const ddata = zvs.getData(branchId, zvs.data.global("definitions")).data;
    const definitionsBranchId = zvs.getData(branchId, zvs.getData(branchId, ddata).branchId);
    
    const match = zvs.definitionsMatch[definitionsBranchId];
    
    const rm = match.match(branchId, q);
    const r = rm.results.concat(rm.loopResults).filter(t => tuples.indexOf(t.tuple) !== -1);
    
    return r;
*/
/*
    const r = [];

    for (var i=0; i<tuples.length; i++) {
        const tuple = tuples[i];
        const md = match.match(branchId, tuple);
        var definitions;
        if (md) {
            console.log(JSON.stringify(md, null, '\t'));
            definitions = Object.keys(md[tuple]);
        }

        if (definitions && definitions.length > 0) {
            const r = lsort[definitions.length] = lsort[definitions.length] || [];

            r.push({
                tuple,
                definitions
            });
        }
        else {
            return;
        }
    }
    
    return r;*/
// }
/*

function planner_1 (zvs, branchId, q) {
    var tuples = getTuples(zvs, branchId, q);
    
    if (tuples.length === 0) {
        return tuples;
    }

    var results = [];

    var cache = {};
    var sizes = {};
    var variables = {};
    
    for (var i=0; i<tuples.length; i++) {
        var id = tuples[i];
        var t = zvs.getObject(branchId, id);
        
        if (!t.virtual) {
            return tuples;
        }
        
        cache[id] = t;

        getVariables(t, id, variables);
    }

    var max;
    for (var i in variables) {
        if (!max || max.length < variables[i].length) {
            max = variables[i];
        }
    }
    
    if (max && max.length) {
        tuples = max;
    }
    
    tuples.sort(function (p, q) {
        return cache[p].virtual.vscore < cache[q].virtual.vscore;
    });
    
    var noloops = tuples.filter(function (t) {
        return !cache[t].loop;
    });

    if (noloops.length > 0) {
        tuples = noloops;
    }

    for (var i=0; i<tuples.length; i++) {
        id = tuples[i];
        t = cache[id];
        
        if (!sizes[t.data.length]) {
            sizes[t.data.length] = true;
            results.push(id);
        }
    }
    
    return results;
}

// -- planner 2 -- 

function planner_2 (zvs, branchId, q) {
    var tuples = getTuples(zvs, branchId, q);
    
    if (tuples.length) {
        var cache = {};
        var variables = {};
        
        for (var i=0; i<tuples.length; i++) {
            var id = tuples[i];
            var t = zvs.getObject(branchId, id);
            
            if (!t.virtual) {
                return tuples;
            }
            
            cache[id] = t;
    
            getVariables(t, id, variables);
        }
        
        var results = tuples.filter(function (t) {
            return !cache[t].virtual.score > !cache[t].virtual.vscore;
            // return cache[t].virtual.score > cache[t].virtual.vscore;
        });
        
        if (results.length) {
            tuples = results;
        }
    }
    
    return tuples;
}


// -- Random -- 
function randomPlanner (zvs, branchId, q) {
    var tuples = getTuples(zvs, branchId, q);
    
    if (tuples.length) {
        var items = Math.ceil(Math.random() * tuples.length * 0.5) || 1;
        
        tuples = shuffle(tuples).slice(0, items);
    }
    
    return tuples;
}
*/

/// ---
function groupTuples (zvs, branchId, q, tuples, cache) {
    // normalize id,
    const v = cache[q];
    
    if (v) {
        return v;
    }
    else {
        const qData = zvs.branches.getDataId(branchId, q);
        const d = zvs.getData(branchId, qData);
        const type = zvs.getData(branchId, d.type);
        
        cache[q] = type;
        
        if (type === 'tuple') {
            const data = zvs.getData(branchId, d.data);
            const check = d.check && zvs.getData(branchId, d.check);
            
            var group;

            for (var i=0; i<data.length; i++) {
                const v = data[i];
                const c = groupTuples(zvs, branchId, v, tuples, cache);
                
                if (!check && c === 'variable') {
                    group = tuples.varTuples;
                    tuples.variables[v] = tuples.variables[v] || [];
                    if (tuples.variables[v].indexOf(q) === -1) {
                        tuples.variables[v].push(q);
                    }
                }
            }

            if (!check) {
                group = group || tuples.constTuples;
                group.push(q);
            }
        }
        
        return type;
    }
}

function fullTupleCoverege (zvs, branchId, q) {
    const cache = {};
    const tuples = {
        constTuples: [],
        varTuples: [],
        variables: {}
    };
    
    groupTuples(zvs, branchId, q, tuples, cache);

    const table = {};
    var sets = [];
    
    if (tuples.varTuples.length) { 
        for (var v in tuples.variables) {
            const ts = tuples.variables[v];
            
            ts.forEach(function (t) {
                if (!table[t]) {
                    const d = {key: [t], tuples: []};
                    sets.push(d);
                    table[t] = d.tuples;
                }
    
                ts.forEach(function (tuple) {
                    if (table[t].indexOf(tuple) === -1) {
                        table[t].push(tuple);
                    }
                });
            });
        }
    
        var max;
        for (var i=0; i<sets.length; i++) {
            const s = sets[i];
                
            if (s.tuples.length === tuples.varTuples.length) {
                max = s.key;
                break;
            }
        }

        /*
            a, b, c
            
            a * b
            a * c
            b * c
            
            a * b * a * c => a * b * c
            a * b * b * c => a * b * c
        */
        while(!max) {
            // union of all sets,
            var uSets = [];
            for (var i=0; i<sets.length; i++) {
                const a = sets[i];
                for (var j=i+1; j<sets.length; j++) {
                    const b = sets[j];
                    const r = {
                        key: a.key.concat(b.key.filter(function (t) {
                            return a.key.indexOf(t) === -1;
                        })),
                        tuples: a.tuples.concat(b.tuples.filter(function (t) {
                            return a.tuples.indexOf(t) === -1;
                        }))
                    };
                        
                    if (r.tuples.length === tuples.varTuples.length) {
                        max = r.key;
                        break;
                    }
                        
                    uSets.push(r);
                }
                    
                if (max) {break;}
            }
                
            sets = uSets;
        }
    
        return max.concat(tuples.constTuples);
    }
    
    return tuples.constTuples;
}


/*
    Grow planners
*/
/*
    Sort tuples by definitions count,
    calculate possible grow.
*/
function planner_1 (zvs, branchId, q) {
    // console.log(utils.toString(zvs.getObject(branchId, q), true));

    const tuples = getTuples(zvs, branchId, q);

    if (tuples.length === 0) {
        return [];
    }
    
    // get defintions branch id,
    const ddata = zvs.getData(branchId, zvs.data.global("definitions")).data;
    const definitionsBranchId = zvs.getData(branchId, zvs.getData(branchId, ddata).branchId);
    
    const match = zvs.definitionsMatch[definitionsBranchId];
    
    const rm = match.match(branchId, q);
//    const r = rm.results.concat(rm.loopResults).filter(t => tuples.indexOf(t.tuple) !== -1);
    
//    return r;


    const matchTuples = rm.results.filter(t => tuples.indexOf(t.tuple) !== -1);

    if (matchTuples.length === 0) {
        // console.log("LR => " + rm.loopResults.map(t => utils.toString(zvs.getObject(branchId, t.tuple), true)).join("; "));

        return rm.loopResults.filter(t => tuples.indexOf(t.tuple) !== -1); 
    }

    // console.log("R => " + matchTuples.map(t => utils.toString(zvs.getObject(branchId, t.tuple), true)).join("; "));

    const lsort = {};

    for (var i=0; i<matchTuples.length; i++) {
        const {tuple, definitions} = matchTuples[i];

        if (definitions && definitions.length > 0) {
            const r = lsort[definitions.length] = lsort[definitions.length] || [];

            r.push({
                tuple,
                definitions
            });
        }
        else {
            return;
        }
    }
    
    var min = Infinity;
    var r;

    for (var l in lsort) {
        const v = Math.pow(+l, lsort[l].length);
        if (min > v) {
            min = v;
            r = lsort[l];
        }
    }
    
    return r;
}




function planner_2 (zvs, branchId, q) {
    const tuples = getTuples(zvs, branchId, q);
    
    // get defintions branch id,
    const ddata = zvs.getData(branchId, zvs.data.global("definitions")).data;
    const definitionsBranchId = zvs.getData(branchId, zvs.getData(branchId, ddata).branchId);
    const match = zvs.definitionsMatch[definitionsBranchId];
    
    const variables = {};
    const novars = [];
    
    if (tuples.length === 0) {
        return [];
    }

    for (var i=0; i<tuples.length; i++) {
        const tuple = tuples[i];
        const definitions = match.match(branchId, tuple);
        
        if (definitions && definitions.length > 0) {
            const r = {
                tuple,
                definitions
            };
            
            const vs = getVariables(zvs, branchId, tuple);
            
            if (vs.length > 0) {
                vs.forEach(v => {
                    const vs = variables[v] = variables[v] || [];
                    vs.push(r);
                });
            }
            else {
                // No variables,
                novars.push(r);
            }
        }
        else {
            return;
        }
    }
    
    const ranks = [];
    var r = [];

    for (var id in variables) {
        const v = variables[id].reduce((result, value) => {
            return result * value.definitions.length;
        }, 1);
        
        ranks.push({
            data: variables[id],
            rank: v
        });        
    }
    
    if (ranks.length) {
        ranks.sort((a, b) => (a.rank - b.rank) || (b.data.length - a.data.length));
        r = ranks[0].data;
    }
    
    return r.concat(novars);
}

function planner_3 (zvs, branchId, q) {
    const tuples = getTuples(zvs, branchId, q);
    
    // get defintions branch id,
    const ddata = zvs.getData(branchId, zvs.data.global("definitions")).data;
    const definitionsBranchId = zvs.getData(branchId, zvs.getData(branchId, ddata).branchId);
    const match = zvs.definitionsMatch[definitionsBranchId];
    
    const variables = [];

    if (tuples.length === 0) {
        return [];
    }

    for (var i=0; i<tuples.length; i++) {
        const tuple = tuples[i];
        const definitions = match.match(branchId, tuple);
        
        if (definitions && definitions.length > 0) {
            const r = {
                tuple,
                definitions
            };
            
            const vs = getVariables(zvs, branchId, tuple);

            const ds = definitions.map(d => {
                const ds = getVariables(zvs, branchId, d);

                if (vs.length < ds.length) {
                    return vs.length;
                }
                
                return ds.length;
            }).reduce((a, b) => {
                return a+b;
            }, 0);

            variables.push({
                r: r,
                rank: ds
            });
        }
        else {
            return;
        }
    }

        
    variables.sort((a, b) => a.rank - b.rank);

    return variables.filter(a => a.rank === variables[0].rank).map(a => a.r);
    
}

module.exports = planner_1;
