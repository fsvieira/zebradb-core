
function toString (p, debug) {

    function ts (v) {
        return toString(v, debug);
    }

    if (!p) {
        return "";
    }

    switch (p.type) {
        case "tuple":
            return (debug?(p.loop && !p.check?"*":""):"") + (debug?(p.check?"@":""):"") + (debug?(p.exists === false?"!":""):"") + "(" + p.data.map(ts).join(" ") + ")"
                + (p.negation && p.negation.length?"[^" + toString(p.negation, debug) + "]":"");

        case "constant":
            return p.data;

        case "variable":
            return "'" + (p.data || ""); // + (debug?":" + p.id:"");

        default:
            if (p.map) {
                return p.map(ts).sort().join("\n");
            }
    }
}

function graph2string (g) {
    var graph = {};
    var data, tuples, transitions;
    
    for (var code in g.graph) {
        data = g.graph[code];

        tuples = [];
        for (var i=0; i<data.tuples.length; i++) {
            tuples.push(toString(g.table[data.tuples[i]], true));
        }

        transitions = [];
        for (var i=0; i<data.transitions.length; i++) {
            transitions.push(toString(g.table[data.transitions[i]], true));
        }
        
        graph[toString(g.table[code], true)] = {
            tuples: tuples,
            transitions: transitions
        };
    }
}

function printQuery (branch, text) {
    console.log((text?text + " => ":"") + toString(branch.getObject(branch.global("query")), true));
}

function profile (obj, minTime) {
    minTime = minTime || 0;
    
    for (var fn in obj.prototype) {
    	obj.prototype[fn] = profileFunc(
    	    obj.prototype[fn],
    	    fn,
    	    minTime
    	);
    }
}

function profileFunc (fn, name, minTime) {
    minTime = minTime || 0;

    return function () {
    	var start = new Date();
    	var value = fn.apply(this, arguments);
    			
    	var end = new Date();
    	var ms = end.getMilliseconds() - start.getMilliseconds();
    	var time = ms / 1000;
    	if (time > minTime) {
    		console.log(name + " : " + time + "s (" + ms +"):: " + JSON.stringify(arguments) );
    	}			
    	
    	return value;
    };
}

function trace (minTime) {
    var start = new Date();
    minTime = minTime || 0;
    return function (text) {
    	var end = new Date();
    	var time = (end.getMilliseconds() - start.getMilliseconds()) / 1000;
    	if (time > minTime) {
    		console.log("(TRACE) " + text + " : " + time + "s");
    	}
		start = end;
    };
}

module.exports = {
    toString: toString,
    graph2string: graph2string,
    printQuery: printQuery,
    profile: profile,
    profileFunc: profileFunc,
    trace: trace
};

