var ZVS = require("./zvs");
var unify = require("./unify");
var utils = require("./utils");

function transitions (zvs, defs, code) {
    var d, r;
    var ts = [];
    for (var i=0; i<defs.length; i++) {
        d = defs[i];
        if (code !== d) {
            r = zvs.change("unify", [code, d]);
                
            if (r && r.length > 0) {
                ts.push(d);
            }
        }
    }
        
    return ts;
}

function loops (codeTuple, g, code, stack) {
    var data = g[code];
    var c;

    if (stack.indexOf(code) !== -1) {
        return;
    }

    stack = stack.slice();
    stack.push(code);
        
    for (var i=0; i<data.transitions.length; i++) {
        c = data.transitions[i];
        
        if (stack.indexOf(c) !== -1) {
            // this transition is recursive,
            codeTuple[code].loop = true;
        }
        else {
            // go to transition,
            loops(codeTuple, g, c, stack);
        }
    }

    for (var i=0; i<data.tuples.length; i++) {
        c = data.tuples[i];
        if (stack.indexOf(c) !== -1) {
            // this transition is recursive,
            codeTuple[code].loop = true;
        }
        else {
            // go to transition,
            loops(codeTuple, g, c, stack);
        }
    }
}

function innerTuples (zvs, codeTuple, g, ts, data) {
    var t, code, tss;
    for (var i=0; i<data.length; i++) {
        t = data[i];
         
        if (t.type === 'tuple') {
            code = zvs.add(t);
         
            if (!codeTuple[code]) {
                ts.push(code);
                codeTuple[code] = t;
                
                setLocalScore(t);
                t.virtual.code = code;
                
                tss = [];
                g[code] = {
                    tuples: tss
                };

                innerTuples(zvs, codeTuple, g, tss, t.data);
            }
        }
    }
}

function setLocalScore (def) {
    var variables = [];
    var tuples = [def];
    var total = 0;
    var refs = 0;
    
    while (tuples.length > 0) {
        var tuple = tuples.pop();
        
        for (var i=0; i<tuple.data.length; i++) {
            var t = tuple.data[i];
            
            if (t.type === 'tuple') {
                tuples.push(t);
            }
            else if (t.type === 'variable') {
                if (!t.name || t.name.length === 0) {
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
        def.virtual = {
            score: 1 - (refs / total)
        };
    }
    else {
        def.virtual = {
            score: -0.01
        };
    }
}

function avgScore (codeTuple, ts) {
    var total = 0;
    for (var i=0; i<ts.length; i++) {
        total += codeTuple[ts[i]].virtual.score;
    }
    
    return total / ts.length;
}

function graph (definitions) {
    
    var zvs = new ZVS();
    var codeTuple = {};
    var g = {};
    var defs;

    zvs.action("unify", function (p, q) {
        return unify(p, q, this, false); // we haven't setup globals to be able to use negation.
    });

    defs = definitions.map(function (def) {
        setLocalScore(def);
        
        var code = zvs.add(def);
        var ts;
        
        if (!codeTuple[code]) {
            codeTuple[code] = def;
            ts = [];
            g[code] = {
                tuples: ts
            };
            
            innerTuples(zvs, codeTuple, g, ts, def.data);
        }
        
        return code;
    });
    
    for (var code in g) {
        var ts = transitions(zvs, defs, code);
        g[code].transitions = ts;
        codeTuple[code].virtual.transitions = ts.concat([code]);
        codeTuple[code].virtual.vscore = avgScore(codeTuple, codeTuple[code].virtual.transitions);
        codeTuple[code].virtual.code = code;
    }
    
    for (var i=0; i<defs.length; i++) {
        loops(codeTuple, g, defs[i], []);
    }

    // console.log(utils.toString(definitions, true));

    return g;
}

module.exports = graph;
