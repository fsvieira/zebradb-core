/*
    Sintax compare.
*/

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
        "ignore": function (p, q) {
            return cmp(q, p);
        }
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
        },
        "ignore": function (p, q) {
            return cmp(q, p);
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
        "ignore": function (p, q) {
            return cmp(q, p);
        }
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
            return cmp(q, p);
        },
        "ignore": function (p, q) {
            return cmp(q, p);
        }
    },
    "not": {
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
                if (cmp(p, q.data[i])) {
                    return true;
                }
            }
            
            return false;
        },
        "not": function (p, q) {
            return cmp(p.data, q.data);
        },
        "ignore": function (p, q) {
            return cmp(q, p);
        }
    },
    "ignore": {
        "constant": function (p, q) {
            return true;
        },
        "variable": function (p, q) {
            return true;
        },
        "tuple": function (p, q) {
            return true;
        },
        "unify": function (p, q) {
            return true;
        },
        "not": function (p, q) {
            return true;
        },
        "ignore": function (p, q) {
            return true;
        }
    }
};

function cmp (p, q) {
    return cmpOp[p.type][q.type](p, q);
}

module.exports = cmp;

