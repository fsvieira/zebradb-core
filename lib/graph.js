var ZVS = require("./zvs");
var unify = require("./unify");
// var utils = require("./utils");

function graph (definitions) {
    
    var zvs = new ZVS();
    var codeTuple = {};
    var g = {};
    var defs;

    zvs.action("unify", function (p, q) {
        return unify(p, q, this, false); // we haven't setup globals to be able to use negation.
    });

    function transitions (code) {
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

    function innerTuples (ts, data) {
        var t, code, tss;
        for (var i=0; i<data.length; i++) {
            t = data[i];
         
            if (t.type === 'tuple') {
                code = zvs.add(t);
         
                if (!codeTuple[code]) {
                    ts.push(code);
                    codeTuple[code] = t;
                    
                    tss = [];
                    g[code] = {
                        tuples: tss
                    };

                    innerTuples(tss, t.data);
                }
            }
        }
    }

    defs = definitions.map(function (def) {
        var code = zvs.add(def);
        var ts;
        
        if (!codeTuple[code]) {
            codeTuple[code] = def;
            ts = [];
            g[code] = {
                tuples: ts
            };
            
            innerTuples(ts, def.data);
        }
        
        return code;
    });
    
    for (var code in g) {
        g[code].transitions = transitions(code);
    }
    
    function loops (code, stack) {
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
                loops(c, stack);
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
                loops(c, stack);
            }
        }
    }

    for (var i=0; i<defs.length; i++) {
        loops(defs[i], []);
    }
    
    return g;
}

module.exports = graph;
