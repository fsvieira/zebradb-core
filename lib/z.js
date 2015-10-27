var zparser = require("./zparser");
var types = require("./types");
var cmp = require("./cmp");
var lazzyUnify = require("./lazzyunify");
var utils = require("./utils");
var renameM = require("./rename");

var giveNames = renameM.giveNames;
var getVariablesNames = renameM.getVariablesNames;
var rename = renameM.rename;
var clone = utils.clone;
var toString = utils.toString;

function getTuples (p, ts, level) {
    ts = ts || [];
    level = level || 0;
    
    if ((p.type === 'tuple') || (p.type === 'unify')) {
        if ((p.type === 'tuple') && !p.check) {
            p.level = level;
            ts.push(p);
        }
        else if ((p.type === 'tuple') && p.check) {
            p.id = 0;
        }
        
        for (var i=0; i<p.data.length; i++) {
            getTuples(p.data[i], ts, level+1);
        }
    }
    else if (p.type === 'not') {
        getTuples(p.data, ts, level+1);
    }

    return ts;
}

function getUnify (p, us) {
    us = us || [];
    
    if ((p.type === 'tuple') || (p.type === 'unify')) {
        if (p.type === 'unify') {
            us.push(p);
        }
        
        for (var i=0; i<p.data.length; i++) {
            getUnify(p.data[i], us);
        }
    }
    else if (p.type === 'not') {
        // us.push(p.not);
        getUnify(p.data, us);
    }
    else if (p.type === 'variable') {
        us.push(p);
    }

    return us;    
}

function solve (q, len) {
    if (!q) {
        return;
    }
    
    var qString = JSON.stringify(q);
    
    if (len && (qString.length > len)) {
        return;
    }

    var vars = getVariablesNames(q);
    var us = getUnify(q);

    for (var i=us.length-1; i>=0; i--) {
        var r = {type: 'unify', data: []};

        r = lazzyUnify(r, us[i]);
        if (!r) {
            return;
        }
        else if ((r.type !== 'unify') && (r.type !== 'variable')) {
            us[i].type = r.type;
            us[i].data = r.data;
            us.splice(i, 1);
        }
    }

    if (vars.length > 0) {
        for (var i=0; i<vars.length; i++) {
            us = getUnify(q);
            
            var name = vars[i];
            var v = {type: 'variable', data: name};
            var vs = us.filter(function (u) {
                return cmp(v, u);
            });

            r = {type: 'unify', data: []};
            for (var j=0; j<vs.length; j++) {
                r = lazzyUnify(r, vs[j]);

                if (!r) {
                    return;
                }
            }

            if (r.type === 'unify') {
                var nus = r.data.filter(function (n) {
                    return n.type !== 'not';
                });
                
                if (nus.length > 1) {
                    for (var j=r.data.length-1; j>=0; j--) {
                        if ((r.data[j].type === 'variable') && (r.data[j].data === name)) {
                            r.data.splice(j, 1);
                        }
                    }
                    
                    if ((r.type === 'unify') && (r.data.length === 1)) {
                        r = r.data[0];
                    }
                }
            }    

            if ((r.type !== 'unify') || (r.data.length > 0)) {
                for (var j=0; j<vs.length; j++) {
                    r = JSON.parse(JSON.stringify(r));
                    vs[j].type = r.type;
                    vs[j].data = r.data;
                }
            }
        }
    } // else nothing to do here!!
    
    if (qString !== JSON.stringify(q)) {
        return solve(q, len);
    }

    return q;
}


function addAnonimousVariables (p) {
    if ((p.type === 'tuple') || (p.type === 'unify')) {
        for (var i=0; i<p.data.length; i++) {
            addAnonimousVariables(p.data[i]);
        }
    }
    else if (p.type === 'not') {
        var not = clone(p);

        p.type = 'unify';
        p.data = [{
            type: 'variable'            
        }, not];
        
        addAnonimousVariables(not.data);
    }
    
    return p;
}

function count(p) {
    if ((p.type === 'tuple') || (p.type === 'unify')) {
        var c = 0;
        for (var i=0; i<p.data.length; i++) {
            c +=count(p.data[i]);
        }
        
        return c;
    }
    else if (p.type === 'constant') {
        return 1;
    }
    
    return 0;
}

function tupleSelect (q, tableDefs) {
    var ts = getTuples(q);
    if (ts.length > 0) {
        var ids = ts.filter(function (t) {
            return t.id;
        });
        
        if (ids.length === 0) {
            ts.forEach(function (t, index) {
                t.id = index + 1;
            });
            
            ids = ts;
        }

        ids = ids.sort(function (a, b) {
            var la = tableDefs[a.data.length].length;
            var lb = tableDefs[b.data.length].length;

            if (la === lb) {
                return count(a) -count(a);
            }
            else {
                return la - lb;
            }
        });

/*        console.log("====");
        ids.forEach(function (item, index) {
            console.log(count(item));
            // console.log(tableDefs[item.data.length].length +", "+ index + ", " + item.data.length);
        });
        console.log("----");
*/
        return ids[0];
        // return ids;
        
        // ts.sort(function (a, b) {return a.level - b.level;});
        // return ts[0];
    }
}

function tableDefinitions (defs) {
    var table = {};
    
    defs.forEach(function (d) {
       table[d.data.length] = table[d.data.length] || [];
       table[d.data.length].push(d);
    });

    return table;
}


function union (p, q)  {
    p = clone(p);
    q = clone(q);

    var pnames = getVariablesNames(p);
    var qnames = getVariablesNames(q);

    q = rename(q, pnames, qnames);

    return solve(lazzyUnify(p, q));
}


function getTupleID (p, id) {
    var r;
    if ((p.type === 'tuple') || (p.type === 'unify')) {
        if ((p.type === 'tuple') && (p.id === id)) {
            return p;
        }

        for (var i=0; i<p.data.length; i++) {
            r = getTupleID(p.data[i], id);
            if (r) {
                break;
            }
        }
    }
    else if (p.type === 'not') {
        r = getTupleID(p.data, id);
    }
    
    return r;
}


function queryTuples (q, ids, defs, len) {
    // all tuples have ids
    var rs, t;
    if (ids.length > 1) {
        var a = queryTuples(q, ids.splice(0, Math.floor(ids.length/2)), defs, len);
        var b = queryTuples(q, ids, defs, len);

        if (a && b) {
            rs = [];
            for (var i=0; i<a.length; i++) {
                for (var j=0; j<b.length; j++) {
                   t = union(a[i], b[j]);
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
        for (var i=0; i < defs.length; i++) {
            var qc = clone(q);
            t = getTupleID(qc, ids[0]);
            
            var dc = JSON.parse(JSON.stringify(defs[i]));

            var qnames = getVariablesNames(qc);
            dc = rename(dc, qnames, dc.bound);

            var u = lazzyUnify(t, dc);
            t.check = true;
            if (u) {
                t.type = u.type;
                t.data = u.data;
                
                qc = solve(qc, len);
                
                if (qc) {
                    rs.push(qc);
                }
            }
        }
    }
    
    return rs;
}

function getTupleIDs (q) {
    // get all tuples,
    var ts = getTuples(q);

    var r = [];
    ts.forEach(function (t) {
        if (t.id) {
            r.push(t.id);
        }
    });
    
    if (r.length === 0) {
        ts.forEach(function (t, index) {
            t.id = index + 1;
            r.push(t.id);
        });
    }

    if (r.length === 0) {
        return;
    }

    return r;
}

function query (q, defs, rs, len) {
    rs = rs || [];
    var ids = getTupleIDs(q);
    if (ids) {
        // return queryTuples(q, ids, defs);
        var ts = queryTuples(q, ids, defs, len);
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
                var p = clone(tuples[i]);
                var q = clone(tuples[j]);

                var pnames = getVariablesNames(p);
                var qnames = getVariablesNames(q);

                q = rename(q, pnames, qnames);

                var r = solve(lazzyUnify(p, q));
                
                if (r) {
                    results.push(r);
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
    	    defs = JSON.parse(JSON.stringify(defs));
    	}
    
        var ds = defs.definitions || defs;
        for (var i=0; i<ds.length; i++) {
            ds[i] = giveNames(addAnonimousVariables(ds[i]));
            ds[i].bound = getVariablesNames(ds[i]);
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
		
		q = giveNames(addAnonimousVariables(q));
		return multiply(query(q, definitions, undefined, len));
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
    // run: run,
    t: types.t,
    v: types.v,
    c: types.c,
    n: types.n,
    toString: toString,
    Run: Run
};
