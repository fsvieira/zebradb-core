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

function query (q, defs, rs, len) {
    rs = rs || [];
    
    for (var i=0; i<defs.length; i++) {
        var qc = JSON.parse(JSON.stringify(q));
        
        var ts = getTuples(qc);
        if (ts.length > 0) {
            ts.sort(function (a, b) {return a.level - b.level;});
            var t = ts[0]; // TODO: make a better tuple choice.
            
            var dc = JSON.parse(JSON.stringify(defs[i]));

            var qnames = getVariablesNames(qc);
            dc = rename(dc, qnames, dc.bound);
            
            // no need for bound variables anymore.
            delete dc.bound;
            
            t.check = true;

            var u = lazzyUnify(t, dc);
            if (u) {
                t.type = u.type;
                t.data = u.data;
            }

            if (u && (qc = solve(qc, len))) {
                query(qc, defs, rs, len);
            }
        }
        else {
            rs.push(qc);
            // nothing else to do!
            break;
        }
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

/*
function run (defs) {
    defs = prepareDefs(defs);
    defs = defs.definitions || defs;
    
	return function (q, len) {
		if (typeof q === 'string') {
			q = zparser.parse(q).definitions[0];
		}
		else {
		    q = JSON.parse(JSON.stringify(q));
		}
		
		q = giveNames(addAnonimousVariables(q));
		return query(q, defs, undefined, len);
	};
}
*/

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
