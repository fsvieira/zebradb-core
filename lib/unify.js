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

function solve (q) {
    var qString = JSON.stringify(q);

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
                }
            }    

            if (r.data.length > 0) {
                if ((r.type === 'unify') && (r.data.length === 1)) {
                    r = r.data[0];
                }

                for (var j=0; j<vs.length; j++) {
                    r = JSON.parse(JSON.stringify(r));
                    vs[j].type = r.type;
                    vs[j].data = r.data;
                }
            }
        }
    } // else nothing to do here!!
    
    if (qString !== JSON.stringify(q)) {
        return solve(q);
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

function query (q, defs, rs) {
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

            if (u && (qc = solve(qc))) {
                query(qc, defs, rs);
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

function run (defs) {
	if (typeof defs === 'string') {
		defs = zparser.parse(defs).definitions;
	}
	else {
	    // clone defs,
	    defs = JSON.parse(JSON.stringify(defs));
	}

    for (var i=0; i<defs.length; i++) {
        defs[i] = giveNames(addAnonimousVariables(defs[i]));
        defs[i].bound = getVariablesNames(defs[i]);
    }

	return function (q) {
		if (typeof q === 'string') {
			q = zparser.parse(q).definitions[0];
		}
		else {
		    q = JSON.parse(JSON.stringify(q));
		}
		
		q = giveNames(addAnonimousVariables(q));
		return query(q, defs);
	};
}


module.exports = {
    run: run,
    t: types.t,
    v: types.v,
    c: types.c,
    n: types.n,
    toString: toString
};
