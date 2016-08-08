var utils = require("./utils");

var table2string = utils.table2string;

function getTuples(q) {
    var tuples = [];
    for (var i=0; i<q.data.length; i++) {
        var v = q.data[i];
        if (!v.check && v.type === 'tuple') {
            if (tuples.indexOf(i) === -1) {
                tuples.push(i);
            }
        }
    }
    
    return tuples;
}

function walker (p, fn, i, ids) {
    ids = ids || [];
    
    if (i===undefined) {
        i = p.start;
    }

    if (ids.indexOf(i) === -1 ) {
        ids.push(i);
        var v = p.data[i];
        
        if (v.type === 'tuple') {
            for (var j=0; j<v.data.length; j++) {
                walker(p, fn, v.data[j]);
            }
        }
        else if (v.type === 'not') {
            walker(p, fn, v.data);
        }
    
        if (v.unify) {
            var u = p.data[v.unify];
            
            for (var j=0; j<u.data.length; j++) {
                walker(p, fn, u.data[j], ids);
            }
        }
        
        fn(p, v, i);
    }
}

//===================
//		Variable Refs 
//===================
function variablesRank (p, i) {
    var total = 0;
    var refs = [];

    walker(p, function constantCounter (p, v, i) {
        if (v.type === 'not' || v.type === 'variable') {
            if (refs.indexOf(i) === -1) {
                refs.push(i);
            }

            total++;
        }
    }, i);
    
    if (total) {
        return (total - refs.length) / total;
    }
    else {
        return -1;
    }
    
}

function variablesXconstants (p, defs, filter) {
    // get tuples,
    var tuples = getTuples(p);
    
    if (tuples.length ===0) {
        // if no tuples than nothing to do
        return tuples;
    }

    // rank definitions,
    var stats = {};
    defs.forEach (function (q) {
        stats[q.data[q.start].data.length] = stats[q.data[q.start].data.length] || [];
        stats[q.data[q.start].data.length].push(variablesRank(q));
    });
    
    // filter all tuples that are less then stats, 
    var ts = tuples.filter(function (i) {
        var t = p.data[i];
        var st = stats[t.data.length];

        for (var k=0; k<st.length; k++) {
            var s = st[k];
            var r = variablesRank(p, i);
            
            if (s < r) {
                return false;
            }
        }

        return true;
    });

    // 
    if (ts.length > 0) {
        console.log("select: " + ts.map(function (i) {
            return table2string(p, i);
        }).join("; "));

        return variables(p, defs, undefined, ts);
    }
    
    console.log("no select: " + tuples.map(function (i) {
        return table2string(p, i);
    }).join("; "));

    // nothing to select.
    return tuples;    
}

function isRecursive (p, t) {
    t = p.data[t];
    for (var i=0; i<t.data.length; i++) {
        var v = p.data[t.data[i]];
        
        if (v.recursive) {
            return true;
        }
    }
    
    return false;
}

function variables (p, defs, filter, tuples) {

    tuples = tuples || getTuples(p);
    if (tuples.length ===0) {
        return tuples;
    }

    // filter non-recursive tuples,
    var nrTuples = tuples.filter(function (t) {
        return !isRecursive(p, t);
    });

    if (nrTuples.length > 0) {
        tuples = nrTuples;
    }

    var stats = [];
    defs.forEach (function (q) {
		stats.push({stat: variablesRank(q), len: q.data[q.start].data.length});
    });
    
    stats.sort(function (a, b) {
		return b.stat - a.stat;
    });
    
    // console.log("STATS: " + JSON.stringify(stats));
    
    var ts = {};
    
    tuples.forEach(function (i) {
		var t = p.data[i];
		ts[t.data.length] = ts[t.data.length] || [];
		ts[t.data.length].push(i);
    });
    
    for (var i=0; i<stats.length; i++) {
		tuples = ts[stats[i].len];
		if (tuples) {
			break;
		}
    }
    
    if (tuples) {
		tuples.sort(function (a, b) {
			var pa = variablesRank(p, a);
			var pb = variablesRank(p, b);
			
			return pa - pb;
		});
		
		stats = tuples.map(function (i) {
			return variablesRank(p, i);
		});
		
		// console.log(JSON.stringify(stats));
		
		if (filter) {
			tuples = tuples.filter(filter);
		}
		
		return tuples.filter(function (i) {
			return variablesRank(p, i) === variablesRank(p, tuples[0]);
		});
	}
}

//===================
//	Constants
//===================
function constantsRank (p, i) {
    var total = 0;
    var constants = 0;

    walker(p, function constantCounter (p, v, i) {
        if (v.type !== 'not' && v.type !== 'variable') {
            constants++;
        }
        
        total++;
    }, i);
    
    return constants / total;
    
}

function constants (p, defs, filter) {
    var tuples = getTuples(p);
    
    tuples.sort(function (a, b) {
        var pa = constantsRank(p, a);
        var pb = constantsRank(p, b);
        
        return pb - pa;
    });
    
    var stats = tuples.map(function (i) {
        return constantsRank(p, i);
    });

    console.log(JSON.stringify(stats));
    
    if (filter) {
		tuples = tuples.filter(filter);
	}
    
    return tuples.filter(function (i) {
        return constantsRank(p, i) === constantsRank(p, tuples[0]);
    });
}

//===================
//		Refs
//===================
function refs (p, defs) {
	var refs = {};
	for (var i=0; i<p.data.length; i++) {
	    var v = p.data[i];
	    
		if (!v.check && v.type === 'tuple') {
			for (var j=0; j<v.data.length; j++) {
				var id = v.data[j];
				var tv = p.data[id];
				
				if (tv.type === 'not' || tv.type === 'variable') {
					refs[id] = refs[id] || [];

					if (refs[id].indexOf(i) === -1) {
						refs[id].push(i);
					}
				}
			}
		}
	}
	
	var r = [];
	for (var i in refs) {
		if (refs[i].length > r.length) {
			r = refs[i];
		}
	}
	
	return r;
}

function refsConstants (p, defs) {
	var rs = refs(p, defs);
	var cs = constants(p, defs, function (i) {
		return rs.indexOf(i) !== -1;
	});
	
	return cs;
}


/*no plann (testing where no plan is needed)*/
function noplan (p, defs) {
    var tuples = getTuples(p);
    return tuples;
}

// Virtual plan, an oracle tale.
// TODO: rename virtual to hint.



// TODO: get the virtual score of tuples,
// * intersect virtual.states when unify with other tuples,
// * if intersect is 0 then unify that states (should fail),
// * get all scores of virtual tuples (recursive), sum it and divide by states length.
// * sum of scores by virtual tuples can be pre-calculated.

function getScore (defs, virtual) {
    var score = 0;
    for (var i=0; i<virtual.states.length; i++) {
        var state = virtual.states[i];
        
        var def = defs[state];
        
        score += def.data[def.start].virtual.vscore;
        
    }
    
    // TODO: score should be divided by number of states ?? less states higher score?
    return (virtual.score + score)/virtual.states.length;
}


function virtualInformationSteps (p, defs) {
    var tuples = getTuples(p);

    if (tuples.length === 0) {
        console.log("PLAN: no tuples... end.");
        return tuples;
    }

    var result = tuples.filter(function (t) {
        return p.data[t].virtual === undefined;
    });

    // TODO: choose parent tuples??
    if (result.length === 0) {
        
        // a query tuple with no states should fail, let it fail sonner than later.
        result = tuples.filter(function (t) {
            return p.data[t].virtual.states.length === 0;
        });
    
        if (result.length > 0) {
            console.log("PLAN: no states.");
            return result;
        }
    
        // sort tuples by virtual score,
        tuples.sort(function (a, b) {
           return getScore(defs, p.data[a].virtual) < getScore(defs, p.data[b].virtual);
        });

        console.log(
            tuples.map(function (t) {
                return getScore(defs, p.data[t].virtual);
            }).join(", ")
        );

        // filter for non-recursive tuples,    
        result = tuples.filter(function (t) {
            // TODO: its only recursive if one of the recursive states is in states.
            return p.data[t].virtual.recursive.length === 0;
        });
        
        if (result.length === 0) {
            console.log("PLAN: recursive tuples selected.");
            result = tuples;
        }

        var score = getScore(defs, p.data[result[0]].virtual);

        // get better score tuples,
        result = result.filter(function (i) {
            return getScore(defs, p.data[i].virtual) === score;
        });
    
        console.log("PLAN: best score tuples selected.");
        return result;
    }

    console.log("PLAN: no virtuals.");
    
    return result;
}

module.exports = {
    constants: constants,
    refs: refs,
    variables: variables,
    variablesXconstants: variablesXconstants,
    // default: noplan
    // default: variables
    default: virtualInformationSteps
};

