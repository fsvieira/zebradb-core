var zparser = require("./zparser");
var types = require("./types");
var cmp = require("./cmp");
var utils = require("./utils");

var clone = utils.clone;
var toString = utils.toString;

/*function toString (p, stack) {
    
}*/

// === PolyFill [BEGIN] === 
if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function(predicate) {
    if (this === null) {
      throw new TypeError('Array.prototype.findIndex called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return i;
      }
    }
    return -1;
  };
}

// === PolyFill [END] ===

function getID (p, q, j, ids) {
    var id, t;
    
    id = ids[j];
    if (id === undefined) {
        t = q.data[j];

        if (t.type !== 'variable') {
            id = p.data.findIndex(function (v) {
                return (v.type === t.type) && (v.data === t.data);
            });
        }
        
        if ((id === undefined) || (id === -1)) {
            var nt = t;
            
            if (t.type === 'tuple') {
                nt = {
                    type: t.type,
                    data: []
                };
                
                for (var i=0; i<t.data.length; i++) {
                    nt.data.push(getID(p, q, t.data[i], ids));
                }
            }

            p.data.push(nt);
            id = p.data.length-1;
        }

        ids[j] = id;
    }
    
    return id;
}


function selfUnify (p, i, j) {
    var id = i;
    if (i !== j) {
        var a = p.data[i];
        var b = p.data[j];

        if (a.type === 'defer') {
            return selfUnify(p, a.data, j);
        }
        else if (b.type === 'defer') {
            return selfUnify(p, i, b.data);
        }
        // variable*variable
        // variable*tuple
        // variable*constant
        // variable*not
        else if (a.type === 'variable') {
            p.data[i] = {
                type: 'defer',
                data: j
            };

            id = j;
        }
        // tuple*variable
        // constant*variable
        // not*variable
        else if (b.type === 'variable') {
            p.data[j] = {
                type: 'defer',
                data: i
            };
            
            id = i;
        }
        else if (a.type === b.type) {
            // tuple*tuple
            // constant*constant
            // not*not
            console.log("self unify -> " + a.type + "*" + b.type);
        }
        else if (
            (a.type === 'tuple' && b.type === 'constant')
            || (a.type === 'constant' && b.type === 'tuple')

        ) {
            // not unifiable
                // tuple*constant 
                // constant*tuple
            return;
        }
        else {
            // tuple*not
            // constant*not
            // not*tuple
            // not*constant

            console.log("self unify -> " + a.type + "*" + b.type);
        }

    }
    
    return id;
}

function clean (p, i, q, write, ids)  {
    q = q || {
        data: [{type: "ignore"}],
        start: 1
    };
    
    ids = ids || {0: 0};
    if (i === undefined) {
        i = p.start;
    }

    var t, v;
    var id = ids[i];
    
    if (id === undefined) {
        v = p.data[i];

        if (v.type === 'defer') {
            return clean (p, v.data, q, write, ids);    
        }
    
        if (v.type === 'tuple' ) {
            t = {
                type: 'tuple',
                data: [],
                check: v.check
            };
            
            q.data.push(t);
            id = q.data.length-1;
            ids[i] = id;
            
            for (var j=0; j<v.data.length; j++) {
                clean(p, v.data[j], q, t, ids);
            }
        }
        else if (v.type === 'not') {
            t = {type: v.type};
            
            q.data.push(t);
            id = q.data.length-1;
            ids[i] = id;
            
            clean(p, v.data, q, t, ids);
        }
        else {
            q.data.push(v);
            id = q.data.length-1;
            ids[i] = id;
        }

    }

    if (write) {
        if (write.type === 'not') {
            write.data = id;
        }
        else {
            write.data.push(id);
        }
    }

    return q;
}

function union (p, q) {
    p = clean(p);
    q = clean(q);

    if (unify(p, p.start, q, q.start)) {
        return p;
    }
}

function unify (p, i, q, j, ids) {
    var id, a, b;

//    console.log(toString(table2tuple(p)));
//    console.log(i + ", " + j + " => " + p.data[i].type + "**" + q.data[j].type);
    if ((i === 0) || (j === 0)) {
        // return a ignore id,
        return 0;
    }
    
    ids = ids || {};
    id = ids[j];

    if (id === undefined) {
        a = p.data[i];
        b = q.data[j];

        if (a.type === 'defer') {
            return unify(p, a.data, q, j, ids);
        }
        else if (b.type === 'defer') {
            return unify(p, i, q, q.data, ids);
        }

        if (a.type === b.type) {
            if (a.type === 'variable') {
                // variable*variable
                id = i;
            }
            else if (a.type === 'tuple') {
                // tuple*tuple
                if (a.data.length === b.data.length) {
                    a.check = a.check || b.check;
                    for (var k=0; k<a.data.length; k++) {
                        a.data[k] = unify(p, a.data[k], q, b.data[k], ids);
                        if (a.data[k] === undefined) {
                            return;
                        }
                    }
                }
                else {
                    return;
                }

                id = i;
            }
            else if (a.type === 'constant') {
                // constant*constant
                if (a.data === b.data) {
                    id = i;
                }
                else {
                    return;
                }
            }
            else if (a.type === 'not') {
                // not*not
                console.log("unify: " + a.type+ "*" + b.type);
            }
            else {
                console.log("unify: " + a.type+ "*" + b.type);
            }
        }
        else if (
            ((a.type === 'constant') && (b.type === 'tuple')) ||
            ((a.type === 'tuple') && (b.type === 'constant'))
        ) {
            // not unifiable
                // tuple*constant
                // constant*tuple
            return;
        }
        else {
            if (a.type === 'variable') {
                // variable*tuple
                // variable*constant
                // variable*not
                id = getID(p, q, j, ids);
            }
            else if (b.type === 'variable') {
                // tuple*variable
                // constant*variable
                // not*variable
                id = i;
            }
            else if (b.type === 'not') {
                console.log("unify: " + a.type+ "*" + b.type);
                // tuple*not
                // constant*not
            }
            else if (a.type === 'not') {
                console.log("unify: " + a.type+ "*" + b.type);
                // not*tuple
                // not*constant
            }
            else {
                console.log(JSON.stringify(p));
                console.log(JSON.stringify(q));

                console.log("unify: " + a.type+ "*" + b.type);
            }
        }
    }
    else if (id !== i) {
        a = p.data[i];
        b = p.data[id];
        
        // unify elements with itself (change )
        id = selfUnify(p, i, id);
            // variable*variable
            // tuple*tuple
            // constant*constant
            // not*not
        // not unifiable
            // tuple*constant 
            // constant*tuple

            // variable*tuple
            // variable*constant
            // variable*not
            // tuple*variable
            // constant*variable
            // not*variable
            // tuple*not
            // constant*not
            // not*tuple
            // not*constant

    }
    // else, nothing to do...

    ids[j] = id;
    
    return id;
}

function queryTuples (q, tuples, defs, len) {
    var rs, t;
    if (tuples.length > 1) {
        var middle = Math.floor(tuples.length / 2);
        var qA = queryTuples(q, tuples.splice(0, middle), defs, len);
        var qB = queryTuples(q, tuples, defs, len);
        
        if (qA && qB) {
            rs = [];
            for (var i=0; i<qA.length; i++) {
                for (var j=0; j<qB.length; j++) {
                   t = union(qA[i], qB[j]);
                   if (t) {
                       rs.push(t);
                   }
                }
            }
            
            if (rs.length === 0) {
                return;
            }
        }
    }
    else {
        rs = [];
        var id = tuples[0];

        for (var i=0; i < defs.length; i++) {
            var dc = clone(defs[i]); // TODO: make a copy not a clone,
            var qc = clone(q);

            qc.data[id].check = true;

            if (unify(qc, id, dc, dc.start)) {
                rs.push(qc);
            }
        }
    }
    
    return rs;
}

function query (q, defs, rs, len) {
    if (q.data.length > len) {
        // enforce stop
        return;
    }

    rs = rs || [];

    var tuples = [];
    for (var i=0; i<q.data.length; i++) {
        var p = q.data[i];
        if (!p.check && (p.type === 'tuple')) {
           tuples.push(i);
        }
    }

    if (tuples.length > 0) {
        var ts = queryTuples(q, tuples, defs, len);
        if (ts) {
            for (var i=0; i<ts.length; i++) {
                query(ts[i], defs, rs, len);
            }
        }
    }
    else {
        rs.push(q);
    }
    
    return rs;
}


function multiply (tuples) {
    if (tuples && tuples.length > 0) {
        var results = [];
        
        for (var i=0; i<tuples.length; i++) {
            for (var j=i+1; j<tuples.length; j++) {
                var p = union(tuples[i], tuples[j]);
                if (p) {
                    results.push(p);
                }
            }
        }
        
        results = multiply(results);
        tuples = tuples.concat(results);
    }
    
    return tuples;
}

function prepareDefs (defs) {
    if (defs) {
        if (typeof defs === 'string') {
    		defs = zparser.parse(defs);
    	}
    	else {
    	    // clone defs,
    	    defs = clone(defs);
    	}
    
        var ds = defs.definitions || defs;
        for (var i=0; i<ds.length; i++) {
            ds[i] = tuple2table(ds[i]);
        }
    }
    
    return defs;
}

function Run (defs) {
    var definitions = [];

    this.query = function (q, len) {
		if (typeof q === 'string') {
			q = zparser.parse(q).definitions[0];
		}
		else {
		    q = clone(q);
		}
		
		q = tuple2table(q);
		
		
		/*
		    TODO:
		        - remove duplicates (this will solve multiply generating infinity by merging same tuples)
		*/
		
		var qr = query(q, definitions, undefined, len);
		var r = multiply(qr);
		
		if (r) {
		    return r.map(function (t) {
		        return table2tuple(t);
		    });
		}
    };
    
    this.add = function (defs, callback, len) {
        if (defs && (defs.length > 0)) {
            defs = prepareDefs(defs);
            definitions = definitions.concat(defs.definitions || defs);
            
            if (callback && defs.queries && defs.queries.length > 0) {
                for (var i=0; i<defs.queries.length; i++) {
                    callback(defs.queries[i].tuple, this.query(defs.queries[i].tuple, len));
                }
            }
        }
    };
    
    this.add(defs);
}


function table2tuple (table, id, tuples) {
    tuples = tuples || {};
    id = (id === undefined)?table.start:id;
    var p = table.data[id];

    if (p.type === 'tuple') {
        var q = tuples[id];
        if (q === undefined) {
            q = {
                type: p.type,
                data: []
            };

            tuples[id] = q;
            for (var i=0; i<p.data.length; i++) {
                q.data.push(table2tuple(table, p.data[i], tuples));
            }
        }
        
        p = q;
    }
    else if (p.type === 'variable') {
        p = {type: p.type, data: 'x$'+id};
    }
    
    return p;
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
        table.data.push({
            type: 'not',
            data: tuple2table(p.data)
        });
        
        id = table.data.length-1;
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
        write.push(id);
    }

    return table;
}

module.exports = {
    t: types.t,
    v: types.v,
    c: types.c,
    n: types.n,
    toString: toString,
    Run: Run
};
