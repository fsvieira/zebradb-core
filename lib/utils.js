var zutils = require("./zutils");

function clone (p) {
    return JSON.parse(JSON.stringify(p));
}

function toString (p, debug) {

    function ts (v) {
        return toString(v, debug);
    }

    if (!p) {
        return "";
    }

    switch (p.type) {
        case "tuple":
            return (debug?(p.check?"@":""):"") + "(" + p.data.map(ts).join(" ") + ")";
            
        case "unify": 
            return  p.data.map(ts).join("*");
            
        case "not":
            return "[^" + toString(p.data, debug) + "]";

        case "constant":
            return p.data;

        case "variable":
            return (p.recursive?"**":"'") + (p.data || "");

        case "ignore":
            return "_";

        default:
            if (p.map) {
                return p.map(ts).sort().join("\n");
            }
    }
}

function table2string (table, start, debug) {
    if (table) {
        return toString(zutils.table2tuple(table, start), debug);
    }
    else {
        return "";
    }
}


function graph2dot (g) {
    // console.log(JSON.stringify(g));
    
    var dot = "";
    for (var from in g.transition) {
        var sFrom = table2string(g.states[from]);
        
        var tos = g.transition[from];
        for (var t=0; t<tos.length; t++) {
            var sTo = table2string(g.states[tos[t].to]);
            
            dot += '\t"' + sFrom + '"' + ' -> ' + '"' + sTo + '"\n';
        }
    }
    
    dot = "digraph G {\n" + dot + "}\n";
    // console.log(dot);
    return dot;
}

module.exports = {
    clone: clone,
    toString: toString,
    table2string: table2string,
    graph2dot: graph2dot
};

