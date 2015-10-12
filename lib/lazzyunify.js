var utils = require("./utils");
var cmp = require("./cmp");

var clone = utils.clone;
var isVariableInTuple = utils.isVariableInTuple;
var toString = utils.toString;

// The Unify Operator.
var lazzyUnifyOp = {
    "constant": {
        "constant": function (p, q) {
            if (p.data === q.data) {
                return p;
            }
        },
        "tuple": function (p, q) {},
        "variable": function (p, q) {
            return {
                type: 'unify',
                data: [p, q]
            };
        },
        "unify": function (p, q) {
            return lazzyUnify({type: 'unify', data: [p]}, q);
        },
        "not": function (p, q) {
            if (cmp(p, q.data)) {
                return;
            }

            if (lazzyUnify(clone(p), clone(q.data))) {
                return {
                    type: 'unify',
                    data: [p, q]
                };
            }
            
            return p;
        }
    },
    "tuple": {
        "constant": function (p, q) {},
        "tuple": function (p, q) {
            if (p.data.length === q.data.length) {
                for (var i=0; i<p.data.length; i++) {
                    p.data[i] = lazzyUnify(p.data[i], q.data[i]);
                    
                    if (!p.data[i]) {
                        return;
                    }
                }
                
                return p;
            }
        },
        "variable": function (p, q) {
            if (!isVariableInTuple(q, p)) {
                return {
                    type: 'unify',
                    data: [p, q]
                };
            }
        },
        "unify": function (p, q) {
            q.data.push(p);
            return q;
        },
        "not": function (p, q) {
            if (cmp(p, q.data)) {
                return;
            }
            
            if (lazzyUnify(clone(p), clone(q.data))) {
                return {
                    type: 'unify',
                    data: [p, q]
                };
            }
            
            return p;
        }
    },
    "variable": {
        "constant": function (p, q) {
            return lazzyUnify(q, p);
        },
        "tuple": function (p, q) {
            return lazzyUnify(q, p);
        },
        "variable": function (p, q) {
            if (p.data === q.data) {
                return p;
            }
            else {
                return {
                    type: 'unify',
                    data: [p, q]
                };
            }
        },
        "unify": function (p, q) {
            return lazzyUnify({type: 'unify', data: [p]}, q);
        },
        "not": function (p, q) {
            if (!cmp(p, q.data)) {
                return {
                    type: 'unify',
                    data: [p, q]
                };
            }
        }
    },
    "unify": {
        "constant": function (p, q) {
            return lazzyUnify(q, p);
        },
        "tuple": function (p, q) {
            return lazzyUnify(q, p);
        },
        "variable": function (p, q) {
            return lazzyUnify(q, p);
        },
        "unify": function (p, q) {
            p.data = p.data.concat(q.data);

            for (var i=0; i<p.data.length; i++) {
                for (var j=p.data.length-1; j>i; j--) {
                    var u = lazzyUnify(p.data[i], p.data[j]);
                    if (u) {
                        if (u.type !== 'unify') {
                            p.data[i].type = u.type;
                            p.data[i].data = u.data;
                            p.data.splice(j, 1);
                        }
                    }
                    else {
                        return;
                    }
                }
            }
            
            if (p.data.length === 1) {
                p = p.data[0];
            }

            return p;
        },
        "not": function (p, q) {console.log("TODO: " + p.type + "*" + q.type );}
    },
    "not": {
        "constant": function (p, q) {
            return lazzyUnify(q, p);
        },
        "tuple": function (p, q) {
            return lazzyUnify(q, p);
        },
        "variable": function (p, q) {
            return lazzyUnify(q, p);
        },
        "unify": function (p, q) {
            return lazzyUnify(q, p);
        },
        "not": function (p, q) {
            console.log("TODO: " + p.type + "*" + q.type );
        }
    }
};

function lazzyUnify(p, q) {
//    console.log("[UNIFY START] " + toString(p) + "*" + toString(q));

    var check = p.check || q.check;
    var r = lazzyUnifyOp[p.type][q.type](p, q);

    console.log("[UNIFY END] " + toString(p) + "*" + toString(q) + " = " + toString(r));
    
    if (r) {
        r.check = check;
    }
    return r;
}

module.exports = lazzyUnify;

