var utils = require("./utils");
var cmp = require("./cmp");

var isVariableInTuple = utils.isVariableInTuple;

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
            if (cmp(p, q)) {
                return q;
            }
            
            for (var i=0; i<q.data.length; i++) {
                if (!lazzyUnify(p, q.data[i])) {
                    return;
                }
            }

            return {
                type: q.type,
                data: q.data.concat([p])
            };
        },
        "not": function (p, q) {
            if (cmp(p, q.data)) {
                return;
            }

            if (lazzyUnify(p, q.data)) {
                return {
                    type: 'unify',
                    data: [p, q]
                };
            }
            
            return p;
        },
        "ignore": function (p, q) {
            return lazzyUnify(q, p);
        }
    },
    "tuple": {
        "constant": function (p, q) {},
        "tuple": function (p, q) {
            if (p.data.length === q.data.length) {
                var r = {
                    type: "tuple",
                    data: []
                };
                for (var i=0; i<p.data.length; i++) {
                    r.data[i] = lazzyUnify(p.data[i], q.data[i]);
                    
                    if (!r.data[i]) {
                        return;
                    }
                }
                
                return r;
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
            if (cmp(p, q)) {
                return q;
            }
            
            var r = {
                type: q.type,
                data: q.data.concat([p])
            };
            
            for (var i=0; i<q.data.length; i++) {
                if (!lazzyUnify(p, q.data[i])) {
                    return;
                }
            }

            return r;
        },
        "not": function (p, q) {
            if (cmp(p, q.data)) {
                return;
            }
            
            if (lazzyUnify(p, q.data)) {
                return {
                    type: 'unify',
                    data: [p, q]
                };
            }
            
            return p;
        },
        "ignore": function (p, q) {
            return lazzyUnify(q, p);
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
            if (cmp(p, q)) {
                return q;
            }
            
            for (var i=0; i<q.data.length; i++) {
                if (!lazzyUnify(p, q.data[i])) {
                    return;
                }
            }

            return {
                type: q.type,
                data: q.data.concat([p])
            };
        },
        "not": function (p, q) {
            if (!cmp(p, q.data)) {
                return {
                    type: 'unify',
                    data: [p, q]
                };
            }
        },
        "ignore": function (p, q) {
            return lazzyUnify(q, p);
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
            var r = {
                type: 'unify',
                data: p.data.concat(q.data)
            };

            for (var i=0; i<r.data.length; i++) {
                for (var j=r.data.length-1; j>i; j--) {
                    var u = lazzyUnify(r.data[i], r.data[j]);
                    if (u) {
                        if (u.type !== 'unify') {
                            r.data[i] = u;
                            r.data.splice(j, 1);
                        }
                    }
                    else {
                        return;
                    }
                }
            }
            
            if (r.data.length === 1) {
                r = r.data[0];
            }

            return r;
        },
        "not": function (p, q) {console.log("TODO: " + p.type + "*" + q.type );},
        "ignore": function (p, q) {
            return lazzyUnify(q, p);
        }
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
            if (cmp(p.data, q.data)) {
                return p;
            }

            return {
                type: 'unify',
                data: [p, q]
            };
        },
        "ignore": function (p, q) {
            return lazzyUnify(q, p);
        }
    },
    "ignore": {
        "constant": function (p, q) {
            return p;
        },
        "tuple": function (p, q) {
            return p;
        },
        "variable": function (p, q) {
            return p;
        },
        "unify": function (p, q) {
            return p;
        },
        "not": function (p, q) {
            return p;
        },
        "ignore": function (p, q) {
            return p;
        }
    }
};

function lazzyUnify(p, q) {
    if (p && q) {
        if (p === q) {
            return p;
        }
         
        var check = p.check || q.check;
        var r = lazzyUnifyOp[p.type][q.type](p, q);
    
        
        if (r && (r.type === 'unify') && (r.data.length === 1)) {
            r = r.data[0];
        }

        if (r && r.type === 'tuple') {
            r.check = check;
        }

        return r;
    }
}

module.exports = lazzyUnify;

