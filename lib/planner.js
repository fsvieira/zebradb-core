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


function shuffle(array) {
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
    
    /*console.log(tuples.map(function (t) {
         return cache[t].virtual.vscore;
    }));*/
    
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

/* -- planner 2 -- */

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

/* -- Random -- */
function randomPlanner (zvs, branchId, q) {
    var tuples = getTuples(zvs, branchId, q);
    
    if (tuples.length) {
        var items = Math.ceil(Math.random() * tuples.length * 0.5) || 1;
        
        tuples = shuffle(tuples).slice(0, items);
    }
    
    return tuples;
}

module.exports = planner_2;