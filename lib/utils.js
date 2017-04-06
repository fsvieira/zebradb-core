
function toString (p, debug) {

    function ts (v) {
        return toString(v, debug);
    }

    if (!p) {
        return "";
    }

    switch (p.type) {
        case "tuple":
            return (debug?(p.loop && !p.check?"*":""):"") + (debug?(p.check?"@":""):"") + "(" + p.data.map(ts).join(" ") + ")"
                + (p.negation && p.negation.length?"[^" + toString(p.negation, debug) + "]":"");
            /*
            return (debug?(p.check?"@":""):"") + "(" + p.data.map(ts).join(" ") + ")" 
                + (debug && p.virtual?"{"+p.virtual.states.join(" ")+"}":"")
                + (debug && p.virtual?"*{"+p.virtual.recursive.join(" ")+"}":"")
                + (debug && p.virtual?p.virtual.score.toFixed(2) + "%":"")
                + (debug && p.virtual && p.virtual.vscore !== undefined?" " + p.virtual.vscore.toFixed(2) + "%":"")
            ;*/

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
    
    console.log(JSON.stringify(graph, null, '\t'));
    
}

function printQuery (branch, text) {
    console.log((text?text + " => ":"") + toString(branch.getObject(branch.global("query")), true));
}


module.exports = {
    toString: toString,
    graph2string: graph2string,
    printQuery: printQuery
};

