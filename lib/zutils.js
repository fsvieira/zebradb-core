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
                check: p.check
            };

            tuples[id] = q;
            for (var i=0; i<p.data.length; i++) {
                q.data.push(table2tuple(table, p.data[i], tuples, cache, vars));
            }
        }
        
        r = q;
    }
    else if (p.type === 'variable') {
        r = {type: p.type, data: 'x$' + varID(id, vars), recursive: p.recursive};
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

module.exports = {
    tuple2table: tuple2table,
    table2tuple: table2tuple,
    graph: graph
};

