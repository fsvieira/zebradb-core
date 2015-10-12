var zparser = require("./zparser");
var types = require("./types");
var cmp = require("./cmp");
var lazzyUnify = require("./lazzyunify");
var utils = require("./utils");

var toString = utils.toString;

/*
    [START] rename functions,
*/
function _getVariables (p, vs, vn, excludeNot) {
    if (p.type === 'variable') {
        if (p.data && (p.data.length > 0)) {
            if (vn.indexOf(p.data) === -1) {
                vn.push(p.data);
                vs.push(p);
            }
        }
        else {
            vs.push(p);
        }
    }
    else if ((p.type === 'tuple') || (p.type === 'unify')) {
        for (var i=0; i<p.data.length; i++) {
            _getVariables(p.data[i], vs, vn, excludeNot);
        }
    }
    else if (!excludeNot && (p.type === 'not')) {
        _getVariables(p.data, vs, vn, excludeNot);
    }
}

function getVariables (p, excludeNot) {
    var vs = [];
    var vn = [];
    
    _getVariables(p, vs, vn, excludeNot);
 
    return {
        variables: vs,
        names: vn
    };
}

function getVariablesNames (p, excludeNot) {
    return getVariables(p, excludeNot).names;
}

function giveNames (p) {
    var vs = getVariables(p);
    
    vs.variables.forEach(function (v) {
        if (!v.data || !v.data.length) {
            v.data = findName(vs.names);
        }
    });
    
    return p;
}

function findName (all) {
    var name;
    var j = 0;
            
    do {
        name = "x$" + j;
        j++;
    } while (all.indexOf(name) !== -1);

    all.push(name);

    return name;
}

function findNames (all, names) {
    var r = {};
    
    for (var i=0; i<names.length; i++) {
        var name = findName(all);
        r[names[i]] = name;
    }
    
    return r;
}

function renameAux (p, names) {
    var name;
    if ((p.type === 'variable') && (name = names[p.data])) {
        p.data = name;
    }
    else if ((p.type === 'tuple') || (p.type === 'unify')) {
        for (var i=0; i<p.data.length; i++) {
            renameAux(p.data[i], names);
        }
    }
    else if (p.type === 'not') {
        renameAux(p.data, names);
    }
    
    return p;
}

function rename (q, namesP, namesQ) {
    var all = namesP.concat(namesQ); 
    var names = [];
    namesP.forEach(function (n) {
        if ((namesQ.indexOf(n) !== -1) && (names.indexOf(n) === -1)) {
            names.push(n);
        }
    });

    var newNames = findNames (all, names);
    return renameAux(q, newNames);
}

/*
    [END] rename functions,
*/

function getTuples (p, ts) {
    ts = ts || [];
    
    if ((p.type === 'tuple') || (p.type === 'unify')) {
        if ((p.type === 'tuple') && !p.check) {
            ts.push(p);
        }
        
        for (var i=0; i<p.data.length; i++) {
            getTuples(p.data[i], ts);
        }
    }
    else if (p.type === 'not') {
        getTuples(p.data, ts);
    }

    return ts;
}

function getUnify (p, us) {
    us = us || [];
    
    if ((p.type === 'tuple') || (p.type === 'unify')) {
        if ((p.type === 'unify') && !p.check) {
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
    
//    console.log("SOLVE: " + toString(q));

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

            for (var j=0; j<vs.length; j++) {
                vs[j].type = r.type;
                vs[j].data = r.data;
            }
        }
    } // else nothing to do here!!
    
    if (qString !== JSON.stringify(q)) {
        console.log("MOD: " + toString(JSON.parse(qString)) + " === " + toString(q));
        return solve(q);
    }

    // console.log("SOLVE RET: " + toString(q));
    
    return q;
}


function query (q, defs, rs) {
    rs = rs || [];
    
    for (var i=0; i<defs.length; i++) {
        var qc = JSON.parse(JSON.stringify(q));
        
        // console.log("QUERY: " + toString(qc));
        var ts = getTuples(qc);
        if (ts.length > 0) {
            var t = ts[0]; // TODO: make a better tuple choice.
            var dc = JSON.parse(JSON.stringify(defs[i]));
            // console.log(" ===> " + toString(dc));
            // console.log("DEFS [BEGIN]: " + toString(qc) + " ** " + toString(dc));
            
            var qnames = getVariablesNames(qc);
            dc = rename(dc, qnames, dc.bound);
            
            // no need for bound variables anymore.
            delete dc.bound;
            
            t.check = true;
            console.log("DEFS: " + toString(qc) + " ** " + toString(dc));
            
            if (lazzyUnify(t, dc) && solve(qc)) {
                query(qc, defs, rs);
            }
        }
        else {
            // console.log("QUERY SAVE: " + toString(qc));

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
        defs[i] = giveNames(defs[i]);
        defs[i].bound = getVariablesNames(defs[i]);
    }

	return function (q) {
		if (typeof q === 'string') {
			q = zparser.parse(q).definitions[0];
		}
		else {
		    q = JSON.parse(JSON.stringify(q));
		}
		
		q = giveNames(q);
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
