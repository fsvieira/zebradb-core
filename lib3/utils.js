function toString (p, debug) {

    function ts (v) {
        return toString(v, debug);
    }

    if (!p) {
        return "";
    }

    switch (p.type) {
        case "tuple":
            return (debug?(p.check?"@":""):"") + "(" + p.data.map(ts).join(" ") + ")" 
                + (debug && p.virtual?"{"+p.virtual.states.join(" ")+"}":"")
                + (debug && p.virtual?"*{"+p.virtual.recursive.join(" ")+"}":"")
                + (debug && p.virtual?p.virtual.score.toFixed(2) + "%":"")
                + (debug && p.virtual && p.virtual.vscore !== undefined?" " + p.virtual.vscore.toFixed(2) + "%":"")
            ;
            
        /*case "unify": 
            return  p.data.map(ts).join("*");*/
            
        /*case "not":
            return "[^" + toString(p.data, debug) + "]";*/

        case "constant":
            return p.data;

        case "variable":
            return "'" + (p.data || "");

        /*case "ignore":
            return "_";*/
        
        case "query":
            return toString(p.query, debug) + (p.negation && p.negation.length?"[^" + toString(p.negation, debug) + "]":"");

        default:
            if (p.map) {
                return p.map(ts).sort().join("\n");
            }
    }
}


module.exports = {
    toString: toString
};

function toString (p, debug) {

    function ts (v) {
        return toString(v, debug);
    }

    if (!p) {
        return "";
    }

    switch (p.type) {
        case "tuple":
            return (debug?(p.check?"@":""):"") + "(" + p.data.map(ts).join(" ") + ")" 
                + (debug && p.virtual?"{"+p.virtual.states.join(" ")+"}":"")
                + (debug && p.virtual?"*{"+p.virtual.recursive.join(" ")+"}":"")
                + (debug && p.virtual?p.virtual.score.toFixed(2) + "%":"")
                + (debug && p.virtual && p.virtual.vscore !== undefined?" " + p.virtual.vscore.toFixed(2) + "%":"")
            ;
            
        /*case "unify": 
            return  p.data.map(ts).join("*");*/
            
        /*case "not":
            return "[^" + toString(p.data, debug) + "]";*/

        case "constant":
            return p.data;

        case "variable":
            return "'" + (p.data || "");

        /*case "ignore":
            return "_";*/
        
        case "query":
            return toString(p.query, debug) + (p.negation && p.negation.length?"[^" + toString(p.negation, debug) + "]":"");

        default:
            if (p.map) {
                return p.map(ts).sort().join("\n");
            }
    }
}


module.exports = {
    toString: toString
};

