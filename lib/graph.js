var ZVS = require("./zvs/zvs");
var unify = require("./unify");
var utils = require("./utils");
var prepare = require("./prepare");

// --- multiply ---
function getZVS () {
    var zvs = new ZVS();
    
    zvs.action("unify", function (zvs, branchId, p, q) {
        return unify(zvs, branchId, p, q); // we haven't setup globals to be able to use negation.
    })
    .action("mergeConflictHandler", function (zvs, branchId, p, q) {
        return unify(zvs, branchId, p, q, this, false);
    });

    return zvs;
}

function _multiply (zvs, r) {
    if (r) {
        var branchA, branchB, ms, branches, newBranches;
        
        branches = r;
        
        for (var i=0; i<branches.length; i++) {
            branchA = branches[i];
            newBranches = [];
            
            for (var j=i+1; j<branches.length; j++) {
                branchB = branches[j];
                
                ms = zvs.merge([branchA, branchB], "mergeConflictHandler");
                
                if (ms && ms.length > 0) {
                    r = r.concat(ms);
                    newBranches = newBranches.concat(ms);
                }
            }
            
            branches = newBranches;
        }
    }
    
    return r;
}

function multiply (definitions) {
    
    var zvs = getZVS();
    var results = [];
    var p, q, r, s;
    var dup = {};
    
    
    for (var i=0; i<definitions.length; i++) {
        p = zvs.data.add(definitions[i]);
        r = [];
        
        for (var j=i; j<definitions.length; j++) {
            q = zvs.data.add(definitions[j]);
            r = r.concat(zvs.change(zvs.branches.root, "unify", [p, q]) || []);
        }
        
        r = _multiply(zvs, r);

        for (var j=0; j<r.length; j++) {
            q = zvs.getObject(r[j], p);
            s = utils.toString(q, true);
            
            if (!dup[s]) {
                dup[s] = true;
                results.push(q);
            }
        }
    }
    
    return prepare.definitions(results);
}


// --- Graph ---
function transitions (tuple, defs) {
    var zvs = new ZVS();
    
    zvs.action("unify", function (zvs, branchId, p, q) {
        return unify(zvs, branchId, p, q, false, true); // we haven't setup globals to be able to use negation.
    });
    
    var p, r;
    var ts = [];
    var q = zvs.data.add(tuple);    

    for (var i=0; i<defs.length; i++) {
        if (tuple.virtual.code !== defs[i].virtual.code) {
            p = zvs.data.add(defs[i]);
            
            r = zvs.change(zvs.branches.root, "unify", [p, q]);
                    
            if (r && r.length > 0) {
                ts.push(defs[i].virtual.code);
            }
        }
    }

    return ts;
    
}

function localScore (tuple) {
    var variables = [];
    var tuples = [tuple];
    var total = 0;
    var refs = 0;
    
    while (tuples.length > 0) {
        tuple = tuples.pop();
        
        for (var i=0; i<tuple.data.length; i++) {
            var t = tuple.data[i];
            
            if (t.type === 'tuple') {
                tuples.push(t);
            }
            else if (t.type === 'variable') {
                if (!t.data || t.data.length === 0) {
                    refs++;
                }
                else if (variables.indexOf(t.name) === -1) {
                    variables.push(t.name);
                    refs++;
                }
                
                total++;
            }
            
            if (t.negation) {
                tuples = tuples.concat(t.negation);
            }
        }
    }
    
    if (total > 0) {
        return 1 - (refs / total);
    }
    
    return -0.01;
}

function getTuples (tuples) {
    var all = [], t, v;
    
    while (tuples.length) {
        t = tuples.pop();
        all.push(t);
        
        if (t.type === 'tuple') {
            for (var i=0; i<t.data.length; i++) {
                v = t.data[i];
                if (v.type === 'tuple') {
                    tuples.push(v);
                }
            }
        }

        if (t.negation) {
            tuples = tuples.concat(t.negation);
        }
    }
    
    return all;
    
}

function avgScore(tuple) {
    var tuples = getTuples([tuple]);
    var total = 0;
    
    for (var i=0; i<tuples.length; i++) {
        total += tuples[i].virtual.score;
    }
    
    return total / tuples.length;
}

function checkLoop (id, graph) {

    // TODO: we need to check the inner tuple transitions, 

    var stack = [];
    var t;
    var transitions = [id];
    
    while (transitions.length) {
        id = transitions.pop();
        t = graph[id];
        
        if (stack.indexOf(id) === -1) {
            transitions.concat(t.virtual.transitions);
            
            for (var i=0; i<t.data.length; i++) {
                if (t.data[i].type === 'tuple') {
                    transitions.push(t.data[i].virtual.code);
                }
            }
            
        }
        else {
            t.loop = true;
        }
    }
}


function loops (tuples, g) {
    for (var i=0; i<tuples.length; i++) {
        var tuple = tuples[i];
        checkLoop(tuple.virtual.code, g);
    }
}

function graph (definitions) {
    definitions = multiply(definitions);
    var tuples = getTuples(definitions.slice());
    var t;
    var g = {};
    
    for (var i=0; i<tuples.length; i++) {
        t = tuples[i];
        
        t.virtual = {
            code: i,
            score: localScore(t)
        };
        
        g[i] = t;
    }

    for (var i=0; i<tuples.length; i++) {
        t = tuples[i];
        t.virtual.vscore = avgScore(tuples[i]);
        t.virtual.transitions = transitions(t, definitions);
    }
    
    loops(definitions, g);

    for (var i=0; i<definitions.length; i++) {
        var v = definitions[i].virtual;
        v.transitions.push(v.code);
    }

    return {
        definitions: definitions,
        graph: g
    };
}

module.exports = graph;
