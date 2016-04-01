var zutils = require("./zutils");

function clone (p) {
    return JSON.parse(JSON.stringify(p));
}

// to string
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
            return "'" + (p.data || "");

        case "ignore":
            return "_";

        default:
            if (p.map) {
                return p.map(ts).join("\n");
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


module.exports = {
    clone: clone,
    toString: toString,
    table2string: table2string
};

