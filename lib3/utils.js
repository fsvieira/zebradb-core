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
            return "'" + (p.data || "") + (debug?":" + p.id:"");

        default:
            if (p.map) {
                return p.map(ts).sort().join("\n");
            }
    }
}


module.exports = {
    toString: toString
};

