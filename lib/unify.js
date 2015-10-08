var zparser = require("./zparser.js");

/*
    [START] rename functions,
*/
function getVariablesNames (p, vs) {
    vs = vs || [];
    
    if (p.type === 'variable') {
        if (vs.indexOf(vs.data) === -1) {
            vs.push(p.data);
        }
    }
    else if ((p.type === 'tuple') || (p.type === 'unify')) {
        for (var i=0; i<p.data.length; i++) {
            getVariablesNames(p.data[i], vs);
        }
    }
    else if (p.type === 'not') {
        getVariablesNames(p.data, vs);
    }

    return vs;
}

function findNames (all, names) {
    var r = {};
    
    for (var i=0; i<names.length; i++) {
        var n;
        var j = 0;
        
        do {
             n = "x$" + j;
             j++;
        } while (all.indexOf(n) !== -1);
        
        r[names[i]] = n;
        all.push(n);
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

    if ((p.type === q.type) && (p.data === q.data)) {
        return p;
    }

    if ((p.type === 'tuple') && (q.type === 'tuple')) {
        if (p.data.length === q.data.length) {
            for (var i=0; i<p.data.length; i++) {
                p.data[i] = lazzyUnify(p.data[i], q.data[i]);
                
                if (!p.data[i]) {
                    return;
                }
            }
        }
        
        return p;
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
    
    var r;
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
                        r.data.splice(j, 1);
                    }
                }
                else {
                    return;
                }
            }
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
        us.push(p);
        getUnify(p.data, us);
    }
    else if (p.type === 'variable') {
        us.push(p);
    }

    return us;    
}

function solve (q) {
    var vars = getVariablesNames(q);
    if (vars.length > 0) {
        var us = getUnify(q);

        for (var i=0; i<vars.length; i++) {
            var name = vars[i];
            var vs = us.filter(function (u) {
                return getVariablesNames(u).indexOf(name) !== -1;
            });

            var r = {type: 'unify', data: []};
            for (var j=0; j<vs.length; j++) {
                r = lazzyUnify(r, vs[j]);
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
                
                for (var j=0; j<us.length; j++) {
                    vs[j].type = r.type;
                    vs[j].data = r.data;
                }
            }
        }
    } // else nothing to do here!!
    
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
                return query(qc, defs, rs);
            }
            else {
                return;
            }
        }
        else {
            rs.push(q);
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

    // TODO: prepare defs:
    // * give varibles names,
    for (var i=0; i<defs.length; i++) {
        defs[i].bound = getVariablesNames(defs[i]);
    }

	return function (q) {
		if (typeof q === 'string') {
			q = zparser.parse(q).definitions[0];
		}
		else {
		    q = JSON.parse(JSON.stringify(q));
		}
		
		// TODO: prepare query:
        // * give varibles names,
		return query(q, defs);
	};
}

/*
var q = run("(yellow blue)");

console.log(JSON.stringify(q("(yellow 'p)")));*/

