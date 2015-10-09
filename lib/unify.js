var zparser = require("./zparser.js");
var types = require("./types.js");

/*
    TODO: 
        * clean up, lazzy unify, 
        * add support for not,
        * add compare functions: variable, tuple and constant.
*/

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
    var all = []; 
    var names = []; 
    namesP.forEach(function (n) {
       if (all.indexOf(n) !== -1) {
           all.push(n);
           if (namesQ.indexOf(n) !== -1) {
               names.push(n);
           }
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

// The Unify Operator.
function lazzyUnify (p, q) {
    var r;

    try {
        JSON.stringify(p);
        JSON.stringify(q);
    }
    catch (e) {
        throw "Cyclic structure detected!!";
    }

    if (!p || !q) {
        return;    
    }
    
    if ((p.type === q.type) && (p.data === q.data)) {
        return p;
    }

    if ((p.type === 'variable') && (q.type === 'tuple')) {
        if (getVariablesNames(q, true).indexOf(p.data) !== -1) {
            return;
        }
    }
    else if ((p.type === 'tuple') && (q.type === 'variable')) {
        return lazzyUnify(q, p);
    }

    if ((p.type === 'not') && (q.type !== 'not')) {
        r = lazzyUnify(
            JSON.parse(JSON.stringify(p.data)), 
            JSON.parse(JSON.stringify(q))
        );
        
        if (!r) {
            return q;
        }
        else {
            if ((p.data.type === q.type) && (p.data.data === q.data)) {
                return;
            }
        }
    }
    else if ((q.type === 'not') && (p.type !== 'not')) {
        return lazzyUnify(q, p);
    }

    if ((p.type === 'tuple') && (q.type === 'tuple')) {
        if (p.data.length === q.data.length) {
            for (var i=0; i<p.data.length; i++) {
                p.data[i] = lazzyUnify(p.data[i], q.data[i]);
                
                if (!p.data[i]) {
                    return;
                }
            }
            
            return p;
        }
        else {
            return;
        }
    }

    if ((p.type === 'constant') && (q.type === 'constant')) {
        if (p.data === q.data) {
            return p;
        }
        
        return;
    }
    
    if (
        ((p.type === 'constant') && (q.type === 'tuple'))
        || ((q.type === 'constant') && (p.type === 'tuple'))
    ) {
        return;
    }
    
    r = undefined;
    if (p.type === 'unify') {
        if (q.type === 'unify') {
            p.data = p.data.concat(q.data);
        }
        else {
            p.data.push(q);
        }
            
        r = p;
    }
    else if (q.type === 'unify') {
        q.data.push(q);
        r = q;
    }
        
    if (r) {
        for (var i=0; i<r.data.length; i++) {
            for (var j=r.data.length-1; j>i; j--) {
                var u = lazzyUnify(r.data[i], r.data[j]);
                if (u) {
                    if (u.type !== 'unify') {
                        r.data[i].type = u.type;
                        r.data[i].data = u.data;
                        r.data.splice(j, 1);
                    }
                }
                else {
                    return;
                }
            }
        }
        
        if (r.data.length === 1) {
            r = r.data[0];
        }
    
        return r;    
    }
    
    return {
        type: "unify",
        data: [p, q]
    };
    
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
            var vs = us.filter(function (u) {
                return getVariablesNames(u, true).indexOf(name) !== -1;
            });

            r = {type: 'unify', data: []};
            for (var j=0; j<vs.length; j++) {
                r = lazzyUnify(r, vs[j]);
                if (!r) {
                    return;
                }
            }

            for (var j=r.data.length-1; j>=0; j--) {
                if ((r.data[j].type === 'variable') && (r.data[j].data === name)) {
                    r.data.splice(j, 1);
                }
            }
    
            if (r.data.length > 0) {
                if (r.data.length === 1) {
                   r = r.data[0];
                }
                    
                for (var j=0; j<vs.length; j++) {
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


function query (q, defs, rs) {
    rs = rs || [];
    
    for (var i=0; i<defs.length; i++) {
        var qc = JSON.parse(JSON.stringify(q));
        var ts = getTuples(qc);
        if (ts.length > 0) {
            var t = ts[0]; // TODO: make a better tuple choice.
            var dc = JSON.parse(JSON.stringify(defs[i]));
            var qnames = getVariablesNames(q);
            dc = rename(dc, qnames, dc.bound);
            
            // no need for bound variables anymore.
            delete dc.bound;
            
            t.check = true;
            if (lazzyUnify(t, dc) && solve(qc)) {
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

// to string
function toString (p) {
    if (!p) {
        return "";
    }
    
    switch (p.type) {
        case "tuple":
            return "(" + p.data.map(toString).join(" ") + ")";
            
        case "unify": 
            return  p.data.map(toString).join("*");
            
        case "not":
            return "[^" + toString(p.data) + "]";

        case "constant":
            return p.data;

        case "variable":
            return "'" + (p.data || "");
        default:
            if (p.map) {
                return p.map(toString).join("\n");
            }
    }
}

module.exports = {
    run: run,
    t: types.t,
    v: types.v,
    c: types.c,
    n: types.n,
    toString: toString
};
