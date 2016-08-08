var Writer = require("./writer");
var unify = require("./unify");

// to string
function varID (i, vars) {
    var id = vars.indexOf(i);
    if (id === -1) {
        id = vars.length;
        vars.push(i);
    }
    
    return id;
}

function table2tuple (
    table, 
    id, 
    tuples,
    cache,
    vars
) {
    
    vars = vars || [];
    cache = cache || {};
    tuples = tuples || {};
 
    id = (id === undefined)?table.start:id;
    
    if (cache[id]) {
        return cache[id];
    }

    var p = table.data[id];
    var q, r=p;

    if (p.type === 'not') {
        r = {
            type: p.type,
            data: table2tuple(table, p.data, tuples, cache, vars)
        };
    }
    else if (p.type === 'tuple') {
        q = tuples[id];
        if (q === undefined) {
            q = {
                type: p.type,
                data: [],
                check: p.check,
                virtual: p.virtual
            };

            tuples[id] = q;
            for (var i=0; i<p.data.length; i++) {
                q.data.push(table2tuple(table, p.data[i], tuples, cache, vars));
            }
        }
        
        r = q;
    }
    else if (p.type === 'variable') {
        r = {type: p.type, data: 'x$' + varID(id, vars)};
    }
    
    if (p.unify !== undefined) {
        var ru = cache[p.unify];

        if (ru) {
            if (ru.data.indexOf(r) === -1) {
                ru.data.push(r);
            }
        }
        else {
            ru = {
                type: "unify",
                data: []
            };
            
            cache[p.unify] = ru;
            
            var u = table.data[p.unify].data;
            
            for (var i=0; i<u.length; i++) {
                table2tuple(table, u[i], tuples, cache, vars);
            }
        }
        
        r = ru;
    }
    
    cache[id] = r;

    return r;
}


function tuple2table (p, table, write) {
    table = table || {
        data: [{type: 'ignore'}],
        start: 1
    };

    var id = 0;
    if (p.type === 'unify') {
        console.log("TODO: unify");
    }
    else if (p.type === 'not') {
        var n = {
            type: 'not'
        };
        
        table.data.push(n);
        id = table.data.length-1;
        tuple2table(p.data, table, n);
    }
    else if (p.type === 'tuple') {
        var t = [];
        table.data.push({
            type: 'tuple',
            data: t
        });
        
        id = table.data.length-1;

        for (var i=0; i<p.data.length; i++) {
            tuple2table(p.data[i], table, t);
        }
    }
    else if ((p.type == 'variable') && (!p.data || p.data === '')) {
        table.data.push(p);
        id = table.data.length-1;
    }
    else if (
        (p.type === 'constant')
        || (p.type === 'variable')
    ) {
        id = table.data.findIndex(function (x) {
            return (x.type === p.type) && (x.data === p.data);
        });
        
        if (id === -1) {
            table.data.push(p);
            id = table.data.length-1;
        }
    }
    
    if (write) {
        if (write.type === 'not') {
            write.data = id;   
        }
        else {
            write.push(id);
        }
    }

    return table;
}

/*
    Graph
*/

function setRecursive (defs, state, t, states) {
    states = states || [];
    var def = defs[state];
    t = t===undefined?def.start:t;
    
    var tuple = def.data[t];

    if (states.indexOf(state) === -1) {
        states.push(state);
        
        for (var i=0; i<tuple.data.length; i++) {
            
        }
        
    }
    else {
        return true;
    }
    
    return false;
}

function setLocalScore (p, t) {
    t = t === undefined?p.start:t;
    var v = p.data[t];
    
    var vars = vars || [];

    if (v.type === 'tuple') {
        for (var i=0; i<v.data.length; i++) {
            var index = v.data[i];
            vars = vars.concat(setLocalScore(p, index));
        }
        
        if (vars.length > 0) {
            var refs = 0;
            vars.forEach(function (v, i) {
                if (vars.indexOf(v) === i) {
                    refs++;
                }
            });
        
            v.virtual.score = 1 - (refs / vars.length);
        }
        else {
            v.virtual.score = -0.01; 
        }
    }
    else if (v.type === 'variable') {
        vars.push(t);
    }
    else if (v.type === 'not') {
        vars = vars.concat(setLocalScore(p, v.data));
    }
    
    return vars;
}


function getGlobalScore (defs, state, states, virtual) {
    states = states || [];
    var score = 0;

    if (states.indexOf(state) === -1) {
        states.push(state);
        var p = defs[state];
        // var tuple = p.data[p.start];
        // var score = tuple.virtual.score;
        // var virtuals = 0;
        
        for (var i=0; i<p.data.length; i++) {
            var v = p.data[i];

            if (v.type === 'tuple') {
                for (var j=0; j < v.virtual.states.length; j++) {
                    score += getGlobalScore(defs, v.virtual.states[j], states.slice(0), v.virtual);
                }

                score += v.virtual.score;                
                // virtuals += v.virtual.states.length + 1;
            }
        }
        
        return score;
    }
    else {
        if (virtual.recursive.indexOf(state) === -1) {
            virtual.recursive.push(state);
        }
    }
    
    return score;
}

// Score,
/*
function g_recursive (g, from, states) {
    if (from === undefined) {
        for (var f=0; f<g.states.length; f++) {
            g_recursive(g, f, []);
        }
    }
    else if (states.indexOf(from) === -1) {
        states.push(from);
        var tos = g.transition[from];
        for (var t=0; t<tos.length; t++) {
            var to = tos[t];
            if (g_recursive(g, to.to, states.slice(0))) {
                to.recursive = true;
                to.tuples.forEach(function (t) {
                    var p = g.states[from];
                    var tuple = p.data[t];
                    
                    for (var i=0; i<tuple.data.length; i++) {
                        t = p.data[tuple.data[i]];
                        if (t.type === 'variable') {
                            t.recursive = true;
                        }
                    }
                });
            }
        }
    }
    else {
        // its recursive,
        return true;
    }
    
    return false;
}
*/

/*
function g_transition (p, q) {
    var r = [];
    
    for (var i=0; i<p.data.length; i++) {
		if (i !== p.start) {
			var w = new Writer(p, q);
			if (w.get(i).type === 'tuple') {
				if (unify(w, i, p.data.length + q.start) !== undefined) {
					r.push(i);
				}
			}
		}
    }

    return r;
}
*/

function g_transition (p, q, g, to) {
    var r = [];
    
    for (var i=0; i<p.data.length; i++) {
        if (p.data[i].type === 'tuple') {
            p.data[i].virtual = p.data[i].virtual || {states: [], recursive: [] /*, g: g*/};
        }
        
		if (i !== p.start) {
			var w = new Writer(p, q);

			if (w.get(i).type === 'tuple') {
				if (unify(w, i, p.data.length + q.start) !== undefined) {
					r.push(i);
					if (p.data[i].virtual.states.indexOf(to) === -1) {
    					p.data[i].virtual.states.push(to);
					}
				}
			}
		}
    }

    return r;
}


function graph (defs) {
    var g = {transition: {}, states: defs};
    
    for (var from=0; from<g.states.length; from++) {
        var p = g.states[from];
        var tos = [];
        
        g.transition[from] = tos;
        
        for (var to=0; to<g.states.length; to++) {
            var q = g.states[to];
            var r = g_transition(p, q, g, to);
            if (r.length > 0) {
                tos.push({to: to, tuples: r});
            }
        }
    }

    defs.forEach(function (def, i) {
       setLocalScore(defs[i]);
    });

    defs.forEach(function (def, i) {
        def.data[def.start].virtual.vscore = getGlobalScore(defs, i);
    });
    
    // console.log("Graph ===>\n" + JSON.stringify(g, null, "\t"));
    return g;
}

/*
function graph (defs) {
    var g = {transition: {}, states: defs};
    
    for (var from=0; from<g.states.length; from++) {
        var p = g.states[from];
        var tos = [];
        
        g.transition[from] = tos;
        
        for (var to=0; to<g.states.length; to++) {
            var q = g.states[to];
            var r = g_transition(p, q);
            if (r.length > 0) {
                tos.push({to: to, tuples: r});
            }
        }
    }

    g_recursive(g);
    
    return g;
}
*/

module.exports = {
    tuple2table: tuple2table,
    table2tuple: table2tuple,
    graph: graph
};

