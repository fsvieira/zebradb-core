var utils = require("./utils");

function getTuples (q, b, tuples) {
    // normalize id,
    q = b.getId(q);
    
    tuples = tuples || [];

    if (tuples.indexOf(q) === -1) {
        var d = b.get(q);
    
        if (b.get(d.type) === 'tuple') {
            if (!d.check || !b.get(d.check)) {
                tuples.push(q);
            }
            
            var data = b.get(d.data);
            for (var i=0; i<data.length; i++) {
                getTuples(data[i], b, tuples);
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


function planner (q, b) {
    var tuples = getTuples(q, b);
    
    if (tuples.length === 0) {
        return tuples;
    }

    var results = [];

    var cache = {};
    var sizes = {};
    var variables = {};
    
    for (var i=0; i<tuples.length; i++) {
        var id = tuples[i];
        var t = b.getObject(id);
        
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
    
    // console.log(tuples.map(function (t) {
    //     return cache[t].virtual.vscore;
    // }));
    
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

module.exports = planner;