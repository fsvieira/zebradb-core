/*
    Sintax compare.
*/

// to string
/*
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
}*/

var cmpOp = {
    "constant": {
        "constant": function (p, q) {
            return p.data === q.data;
        },
        "variable": function (p, q) {return false;},
        "tuple": function (p, q) {return false;},
        "unify": function (p, q) {
            for (var i=0; i<q.data.length; i++) {
                if (cmp(p, q.data[i])) {
                    return true;
                }
            }
            
            return false;
        },
        "not": function (p, q) {
            return false;
        },
    },
    "variable": {
        "constant": function (p, q) {return false;},
        "variable": function (p, q) {
            return p.data === q.data;
        },
        "tuple": function (p, q) {
            return false;
        },
        "unify": function (p, q) {
            for (var i=0; i<q.data.length; i++) {
                if (cmp(p, q.data[i])) {
                    return true;
                }
            }
            
            return false;
        },
        "not": function (p, q) {
            return false;
        }
    },
    "tuple": {
        "constant": function (p, q) {
            return false;
        },
        "variable": function (p, q) {
            return cmp(q, p);
        },
        "tuple": function (p, q) {
            // console.log("==>" + toString(p) + " = " + toString(q));
            if (p.data.length === q.data.length) {
                for (var i=0; i<p.data.length; i++) {
                    if (!cmp(p.data[i], q.data[i])) {
                        return false;
                    }
                }

                return true;
            }
            
            return false;
        },
        "unify": function (p, q) {
            for (var i=0; i<q.data.length; i++) {
                if (cmp(p, q.data[i])) {
                    return true;
                }
            }
            
            return false;
        },
        "not": function (p, q) {
            return false;
        },
    },
    "unify": {
        "constant": function (p, q) {
            return cmp(q, p);
        },
        "variable": function (p, q) {
            return cmp(q, p);
        },
        "tuple": function (p, q) {
            return cmp(q, p);
        },
        "unify": function (p, q) {
            for (var i=0; i<q.data.length; i++) {
                if (cmp(q.data[i], q)) {
                    return true;
                }
            }

            return false;
        },
        "not": function (p, q) {
            if (cmp(p, q.data)) {
                return false;
            }
        },
    },
    "not": {
        "constant": function (p, q) {console.log("TODO: " + p.type + " === " + q.type);},
        "variable": function (p, q) {console.log("TODO: " + p.type + " === " + q.type);},
        "tuple": function (p, q) {console.log("TODO: " + p.type + " === " + q.type);},
        "unify": function (p, q) {
            for (var i=0; i<q.data.length; i++) {
                if (cmp(p, q.data[i])) {
                    return true;
                }
            }
            
            return false;
        },
        "not": function (p, q) {
            return cmp(p.data, q.data);
        }
    }
};

function cmp (p, q) {
    var r = cmpOp[p.type][q.type](p, q);
    // console.log(toString(p) + " === " + toString(q) + " = " + r);
    return r;
}

module.exports = cmp;

