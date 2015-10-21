var cmp = require("./cmp");

function clone (p) {
    return JSON.parse(JSON.stringify(p));
}

function isVariableInTuple (p, q) {
    for (var i=0; i<q.data.length; i++) {
        if (cmp(p, q.data[i])) {
            return true;
        }
    }
}

// to string
function toString (p) {
    if (!p) {
        return "";
    }
    
    switch (p.type) {
        case "tuple":
            return /*(p.check?"@":"") +*/ "(" + p.data.map(toString).join(" ") + ")";
            
        case "unify": 
            return  p.data.map(toString).join("*");
            
        case "not":
            return "[^" + toString(p.data) + "]";

        case "constant":
            return p.data;

        case "variable":
            return "'" + (p.data || "");

        case "ignore":
            return "_";

        default:
            if (p.map) {
                return p.map(toString).join("\n");
            }
    }
}


module.exports = {
    clone: clone,
    isVariableInTuple: isVariableInTuple,
    toString: toString
};

