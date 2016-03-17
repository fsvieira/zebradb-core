require("./polyfill");

var zparser = require("./zparser");
var types = require("./types");
var utils = require("./utils");
var unify = require("./unify");

var zutils = require("./zutils");

var tuple2table = zutils.tuple2table;
var table2tuple = zutils.table2tuple;

var toString = utils.toString;

var Writer = require("./writer");

function cleanDuplicates (p, i, q, ids) {
    i = (i===undefined)?p.start:i;
    
    q = q || {
        data: [{type: "ignore"}]
    };
    
    
    ids = ids || {0: 0};

    q.start = _cleanDuplicates(p, i, q, ids);
    
    return q;
}

function _cleanDuplicates (p, i, q, ids) {
    var id = ids[i];

    if (id === undefined) {
        var t, v;
        v = p.data[i];
        
        if (v.type === 'defer') {
            id = _cleanDuplicates(p, v.data, q, ids);
        }
        else if (v.type === 'unify') {
            t = {
                type: v.type,
                data: [],
                check: v.check
            };

            for (var j=0; j<v.data.length; j++) {
                var a = _cleanDuplicates(p, v.data[j], q, ids);
                if (t.data.indexOf(a) === -1) {
                    t.data.push(a);
                }
            }
        }
        else if (v.type === 'tuple') {
            t = {
                type: v.type,
                data: [],
                check: v.check
            };
            
            for (var j=0; j<v.data.length; j++) {
                t.data[j] = _cleanDuplicates(p, v.data[j], q, ids);
            }

        }
        else if (v.type === 'not') {
            t = {
                type: v.type,
                data: _cleanDuplicates(p, v.data, q, ids)
            };

        }
        else {
            t = v;
        }

        if (t) {
            if (v.type !== 'variable') {
                for (var j=0; j<q.data.length; j++) {
                    v = q.data[j];
    
                    if (v.type === t.type) {
                        if (v.data === t.data) {
                            id = j;
                            break;
                        }
                        else if (
                            v.data &&
                            t.data && 
                            v.data.length && 
                            t.data.length && 
                            (v.data.length === t.data.length)
                        ) {
                            var equal = true;
                            for (var k=0; k<v.data.length; k++) {
                                if (v.data[k] !== t.data[t]) {
                                    equal = false;
                                    break;
                                }
                            }
                            
                            if (equal) {
                                v.check = v.check || t.check;
                                id = j;
                                break;
                            }
                        }
                    }
                }
            }
            
            if (id === undefined) {
                q.data.push(t);
                id = q.data.length-1;
            }
        }
        
        ids[i] = id;
    }

    return id;
}

function shuffle (array) {
    var i = 0;
    var j = 0;
    var temp = null;

    for (i = array.length - 1; i > 0; i -= 1) {
        j = Math.floor(Math.random() * (i + 1));
        temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function queryTuples (q, tuples, defs, len) {
    var r = [];

    for (var t=0; t<tuples.length; t++) {
        var rs = [];
        var id = tuples[t];
        
        for (var i=0; i < defs.length; i++) {
            var dc = defs[i];
            var qc = new Writer(q, dc);
            qc.get(id).check = true;
            if (unify(qc, id, q.data.length + dc.start) !== undefined) {
                rs.push(qc);
            }
        }
        
        if (rs.length === 0) {
            return;
        }
        
        /*
        console.log("len(rs) = " + rs.length);
        
        if (r.length > 0) {
            var qA = r;
            var qB = rs;
                            
            r = [];
                            
            for (var i=0; i<qA.length; i++) {
                for (var j=0; j<qB.length; j++) {
                
                    var tuple = qA[i].union(qB[j]);
                
                    if (tuple) {
                        r.push(tuple);
                    }
                }
            }
            
            if (r.length === 0) {
                return;
            }
        }
        else {
            r = rs;
        }
        */
        
        r.push(rs);
        
    }

        // mk union,
        // r = r.reverse();
        
        while(r.length > 1) {
            shuffle(r);
            /*r.sort(function (qA, qB) {
                var count = 0;
                for (var i=0; i<qA.length; i++) {
                    for (var j=0; j<qB.length; j++) {
                
                        if(qA[i].union(qB[j])) {
                            count++;
                        }
                    }
                }
                
                return count - 100;
            });*/

            console.log("[" + r.map(function (a) {
                return a.length;
            }).join(",") + "]");
                        
            var qA = r.pop();
            var qB = r.pop();
                            
            rs = [];
            
            for (var i=0; i<qA.length; i++) {
                for (var j=0; j<qB.length; j++) {
                
                    var tuple = qA[i].union(qB[j]);
                
                    if (tuple) {
                        rs.push(tuple);
                    }
                }
            }
                        
            if (rs.length === 0) {
                return;
            }
            
            /*if ((r.length > 7) && rs.length > 10) {
                r.push(qA);
                r.push(qB);
            }
            else {
                r.push(rs);
            }*/
            r.push(rs);
        }

//    return r;
    return r[0];
}


function getTuples (p, ts, tuples) {
    tuples = tuples || [];
    
    while(ts.length > 0) {
        var t = ts[0];
        ts.splice(0, 1);
        
        if (tuples.indexOf(t) === -1) {
            var v = p.data[t];
    
            if (v.type === 'tuple') {
                if (!v.check) {
                    tuples.push(t);
                }
                
                for (var i=0; i<v.data.length; i++) {
                    if (ts.indexOf(v.data[i]) === -1) {
                        ts.push(v.data[i]);
                    }
                }
            }
            else if (v.type === 'not') {
                ts.push(v.data);
            }
        }
    }

    return tuples;
}

function query (q, defs, rs, len) {
    // q = cleanDuplicates(q);

    // console.log("QUERY " + (COUNT++) + " ---> " + utils.table2string(q));
    
    // console.log("== NEW QUERY ==");
    
    if (q.data.length > len) {
        // enforce stop
        return;
    }

    rs = rs || [];

    var tuples = getTuples(q, [q.start], tuples);
    
    if (tuples.length > 0) {
        var ts = queryTuples(q, tuples, defs, len);
        if (ts) {
            for (var i=0; i<ts.length; i++) {
                // console.log("!"+i);

                var t = ts[i].commit();
                // console.log("t= " + utils.table2string(t));
                // t = clean(t);
                // console.log("*t= " + utils.table2string(t));
                query(t, defs, rs, len);
            }
        }
    }
    else {
        rs.push(q);
    }
    
    return rs;
}


function cmp (a, b) {
    if (a.type === b.type) {
        if (a.data !== b.data) {
            if (
                (a.data && b.data) &&
                (a.data.length === b.data.length)
            ) {
                for (var i=0; i<a.data.length; i++) {
                    if (a.data[i] !== b.data[i]) {
                        return false;
                    }
                }
                
                return true;
            }
            
            return false;
        }
        
        return true;
    }
    
    return false;
}

function cmpTables (a, b) {
    if (
        (a.start === b.start) &&
        (a.data.length === b.data.length)
    ) {
        for (var i=0; i<a.data.length; i++) {
            var aa = a.data[i];
            var bb = b.data[i];
            
            if (!cmp(aa, bb)) {
                return false;
            }
        }
        
        return true;
    }
    
    return false;
}

function removeDuplicates (tuples) {
    var ts = [];

    tuples.forEach (function (t, index) {
        tuples[index] = cleanDuplicates(t);        
    });

    for (var i=0; i<tuples.length; i++) {
        var t = tuples[i];

        var insert = true;        
        for (var j=0; j<ts.length; j++) {
            if (!cmpTables(t, ts[j])) {
                break;
            }
        }

        if (insert) {
            ts.push(t);
        }
    }

    return ts;
}

function multiply (tuples) {
    if (tuples && tuples.length > 0) {
        // tuples = removeDuplicates(tuples);
        var results = [];
        
        for (var i=0; i<tuples.length; i++) {
            for (var j=i+1; j<tuples.length; j++) {
                var a = tuples[i];
                var b = tuples[j];
                var p = new Writer(a, b);

                if (unify(p, a.start, a.data.length + b.start) !== undefined) {
                    // results.push(clean(p.commit()));
                    results.push(p.commit());
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
    	    // Clone definitions, 
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

		var qr = query(q, definitions, undefined, len);
		
		/*qr.forEach(function (t) {
		   console.log("QUERY [rs] " + (COUNT++) + " ---> " + utils.table2string(t)); 
		});*/
		
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
                    var f = eval(defs.queries[i].code);

                    callback(defs.queries[i].tuple, this.query(defs.queries[i].tuple, len), f);
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
