require("./polyfill");

var zparser = require("./zparser");
var types = require("./types");
var utils = require("./utils");
var unify = require("./unify");

var zutils = require("./zutils");

var tuple2table = zutils.tuple2table;
var table2tuple = zutils.table2tuple;

var toString = utils.toString;
var clone = utils.clone;


function getID (p, q, j, ids) {
    var id, t;
    
    ids = ids || {};
    
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
            
            if ((t.type === 'tuple') || (t.type === 'unify')) {
                nt = {
                    type: t.type,
                    data: []
                };
                
                for (var i=0; i<t.data.length; i++) {
                    nt.data.push(getID(p, q, t.data[i], ids));
                }
            }
            else if (t.type === 'not') {
                nt = {
                    type: t.type,
                    data: getID(p, q, t.data, ids)
                };
            }

            p.data.push(nt);
            id = p.data.length-1;
        }

        ids[j] = id;
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
    
        if ((v.type === 'tuple') || (v.type === 'unify')) {
            t = {
                type: v.type,
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
    var qID = getID(p, q, q.start);

    if (unify(p, p.start, qID)) {
        return clean(p);
    }
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
            var dc = defs[i];
            var qc = clone(q); // TODO: make a copy not a clone,

            qc.data[id].check = true;

            if (unify(qc, id, getID(qc, dc, dc.start))) {
                qc = clean(qc);
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
    	    // defs = clone(defs);
    	    defs = JSON.parse(JSON.stringify(defs));
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
		    q = JSON.parse(JSON.stringify(q));
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



module.exports = {
    t: types.t,
    v: types.v,
    c: types.c,
    n: types.n,
    toString: toString,
    Run: Run
};
