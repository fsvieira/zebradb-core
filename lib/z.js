require("./polyfill");

var zparser = require("./zparser");
var types = require("./types");
var cmp = require("./cmp");
var utils = require("./utils");
var selfUnify = require("./selfunify");
var zutils = require("./zutils");

var create = zutils.create;
var toString = utils.toString;
var clone = utils.clone;


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
    q = clean(q);

    if (unify(p, p.start, q, q.start)) {
        return p;
    }
}


function UnifyTODO (p, i, q, j, ids) {
    console.log("Unify TODO: " + p.data[i].type + "*" + q.data[j].type);
}

function _unifyIgnore (p, i, q, j, ids) {return 0;}
function _unifyVariable (p, i, q, j, ids) {
    return getID(p, q, j, ids);
}

function _unifyReturnI (p, i, q, j, ids) {
    return i;
}

function _unifyFail () {return;}

var unifyOps = {
    "defer": {
        "defer": UnifyTODO,
        "tuple": UnifyTODO,
        "variable": UnifyTODO,
        "constant": UnifyTODO,
        "not": UnifyTODO,
        "unify": UnifyTODO,
        "ignore": _unifyIgnore
    },
    "tuple": {
        "defer": UnifyTODO,
        "tuple": function (p, i, q, j, ids) {
            var a = p.data[i];
            var b = q.data[j];
            
            if (a.data.length === b.data.length) {
                a.check = a.check || b.check;
                ids[j] = i;
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
        
            return i;
        },
        "variable": _unifyReturnI,
        "constant": _unifyFail,
        "not": function (p, i, q, j, ids) {
            if (!cmp(p, i, q, q.data[j].data, ids)) {
                var id = getID(p, q, j, ids);
                var tid = create(p, p.data[i]);

                p.data[i] = {
                    type: "unify",
                    data: [tid, id]
                };

                return i;
            }
        },
        "unify": UnifyTODO,
        "ignore": _unifyIgnore
    },
    "variable": {
        "defer": UnifyTODO,
        "tuple": _unifyVariable,
        "variable": _unifyReturnI,
        "constant": _unifyVariable,
        "not": _unifyVariable,
        "unify": UnifyTODO,
        "ignore": _unifyIgnore
    },
    "constant": {
        "defer": UnifyTODO,
        "tuple": _unifyFail,
        "variable": _unifyReturnI,
        "constant": function (p, i, q, j, ids) {
            if (p.data[i].data === q.data[j].data) {
                return i;
            }
            
            return;
        },
        "not": function (p, i, q, j, ids) {
            if (!cmp(p, i, q, q.data[j].data, ids)) {
                // get the not data, 
                var id = getID(p, q, q.data[j].data, ids);
                
                // create a not constant
                var cid = create(p, {type: "not", data: i});

                selfUnify(p, id, cid);

                return i;
            }
        },
        "unify": UnifyTODO,
        "ignore": _unifyIgnore 
    },
    "not": {
        "defer": UnifyTODO,
        "tuple": function (p, i, q, j, ids) {
            if (!cmp(p, i, q, q.data[j].data, ids)) {
                var id = getID(p, q, j, ids);
                var tid = create(p, p.data[i]);

                p.data[i] = {
                    type: "unify",
                    data: [tid, id]
                };

                return i;
            }
        },
        "variable": _unifyReturnI,
        "constant": function (p, i, q, j, ids) {
            if (cmp(p, p.data[i].data, q, j, ids)) {
                return;
            }
            
            var cid = getID(p, q, j, ids);
            var id = create(p, {type: p.data[i].type, data: cid});
            ids[j] = id;
            
            selfUnify(p, i, id);
            return cid;
        },
        "not": UnifyTODO,
        "unify": UnifyTODO,
        "ignore": _unifyIgnore 
    },
    "unify": {
        "defer": UnifyTODO,
        "tuple": function (p, i, q, j, ids) {
            for (var k=0; k < p.data[i].data.length; k++) {
                if (unify(p, p.data[i].data[k], q, j, ids) === undefined) {
                    return;
                }
            }
        },
        "variable": UnifyTODO,
        "constant": UnifyTODO,
        "not": UnifyTODO,
        "unify": UnifyTODO,
        "ignore": UnifyTODO
    },
    "ignore": {
        "defer": _unifyIgnore,
        "tuple": _unifyIgnore,
        "variable": _unifyIgnore,
        "constant": _unifyIgnore,
        "not": UnifyTODO,
        "unify": UnifyTODO,
        "ignore": _unifyIgnore
    }
};

function unify (p, i, q, j, ids) {
    // console.log(toString(table2tuple(p)) + " * " + toString(table2tuple(q)));
    
    if ((i === undefined) || (j === undefined)) {
        return;
    }

    ids = ids || {};
    var id = ids[j];

    if (id === undefined) {
        // console.log(p.data[i].type + " * " + q.data[j].type);
        id = unifyOps[p.data[i].type][q.data[j].type](p, i, q, j, ids);
        if (id === undefined) {
            return;
        }
        ids[j] = id;
    }
    else if (id !== i) {
        // unify elements with itself (change )
        id = selfUnify(p, i, id);
        if (id === undefined) {
            return;
        }

        ids[j] = id;
    }
    
    // console.log(toString(table2tuple(p)));
    // console.log(JSON.stringify(p));
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

function table2tuple (table, id, tuples) {
    tuples = tuples || {};
    id = (id === undefined)?table.start:id;
    var p = table.data[id];
    var q;

    if (p.type === 'not') {
        p = {
            type: p.type,
            data: table2tuple(table, p.data, tuples)
        };
    }
    else if (p.type === 'unify') {
        q = {
            type: p.type,
            data: []
        };
        
        for (var i=0; i<p.data.length; i++) {
            q.data.push(table2tuple(table, p.data[i], tuples));
        }
        
        p = q;
    }
    else if (p.type === 'tuple') {
        q = tuples[id];
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

module.exports = {
    t: types.t,
    v: types.v,
    c: types.c,
    n: types.n,
    toString: toString,
    Run: Run
};
