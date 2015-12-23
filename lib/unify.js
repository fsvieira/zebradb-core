var c = require("./cmp");
var utils = require("./utils");

var cmp = c.cmp;
var cmpCodes = c.cmpCodes;

function create (p, q) {
    p.data.push(q);
    return p.data.length-1;
}

function unifyTODO (p, i, j) {
    console.log(" unify todo: " + p.data[i].type + "*" + p.data[j].type);
}

var unifyOp = {
    "defer": {
        "defer": function (p, i, j) {
            var d = unify(p, p.data[i].data, p.data[j].data);
            p.data[i].data = d;
            p.data[j].data = d;
            
            return d;
        },
        "tuple": function (p, i, j) {
            var d = unify(p, p.data[i].data, j);
            p.data[i].data = d;
            
            return d;
        },
        "variable": function (p, i, j) {
            var d = unify(p, p.data[i].data, j);
            p.data[i].data = d;
            
            return d;
        },
        "constant": function (p, i, j) {
            var d = unify(p, p.data[i].data, j);
            p.data[i].data = d;
            
            return d;
        },
        "not": function (p, i, j) {
            var d = unify(p, p.data[i].data, j);
            p.data[i].data = d;
            
            return d;
        },
        "ignore": function (p, i, j) {
            var d = unify(p, p.data[i].data, j);
            p.data[i].data = d;
            
            return d;
        },
        "unify": function (p, i, j) {
            var d = unify(p, p.data[i].data, j);
            p.data[i].data = d;
            
            return d;
        }
    },
    "variable": {
        "defer": function (p, i, j) {
            return unify(p, j, i);
        },
        "tuple": function (p, i, j) {
            p.data[i] = {
                type: 'defer',
                data: j
            };
        
            return j;
        },
        "variable": function (p, i, j) {
            p.data[i] = {
                type: 'defer',
                data: j
            };
        
            return j;
        },
        "constant": function (p, i, j) {
            p.data[i] = {
                type: 'defer',
                data: j
            };
        
            return j;
        },
        "not": function (p, i, j) {
            p.data[i] = {
                type: 'defer',
                data: j
            };
        
            return j;
        },
        "ignore": function (p, i, j) {
            return 0;
        },
        "unify": unifyTODO
    },
    "unify": {
        "defer": function (p, i, j) {
            return unify(p, j, i);
        },
        "unify": function (p, i, j) {
            var u = p.data[i];
            for (var k=0; k<u.data.length; k++) {
                if (unify(p, u.data[k], j) === undefined) {
                    return;
                }
            }
            
            p.data[i] = {
                type: "defer",
                data: j
            };

            return j;
        },
        "tuple": function (p, i, j) {
            var u = p.data[i];
            for (var k=0; k<u.data.length; k++) {
                if (unify(p, u.data[k], j) === undefined) {
                    return;
                }
            }

            p.data[i] = {
                type: "defer",
                data: j
            };

            return j;
        },
        "variable": function (p, i, j) {
            var u = p.data[i];
            for (var k=0; k<u.data.length; k++) {
                if (unify(p, u.data[k], j) === undefined) {
                    return;
                }
            }
            
            p.data[i] = {
                type: "defer",
                data: j
            };

            return j;
        },
        "constant": function (p, i, j) {
            var u = p.data[i];
            for (var k=0; k<u.data.length; k++) {
                if (unify(p, u.data[k], j) === undefined) {
                    return;
                }
            }
            
            p.data[i] = {
                type: "defer",
                data: j
            };

            return j;
        },
        "not": function (p, i, j) {
            var u = p.data[i];
            for (var k=0; k<u.data.length; k++) {
                if (unify(p, u.data[k], j) === undefined) {
                    return;
                }
            }
            
            p.data[i] = {
                type: "defer",
                data: j
            };

            return j;
        },
        "ignore": function (p, i, j) {
            return 0;
        }
    },
    "tuple": {
        "defer": function (p, i, j) {
            return unify(p, j, i);
        },
        "tuple": function (p, i, j) {
            var a = p.data[i];
            var b = p.data[j];
            
            if (a.data.length === b.data.length) {
                for (var k=0; k<a.data.length; k++) {
                    a.data[k] = unify(p, a.data[k], b.data[k]);
                    if (a.data[k] === undefined) {
                        return;
                    }
                }
                
                var check = a.check || b.check;
                a.check = check;
                
                p.data[j] = {
                  type: "defer",
                  data: i
                };

                return i;
            }
        },
        "variable": function (p, i, j) {
            return unify(p, j, i);
        },
        "constant": function () {},
        "not": function (p, i, j) {
            var r = cmp(p, i, p.data[j].data);
            
            if (r !== cmpCodes.EQUAL) {
                if (
                    (r === cmpCodes.VARIABLE)
                    || (r === cmpCodes.NOT)
                ) {
                    p.data.push(p.data[i]);
                    var id = p.data.length-1;
    
                    p.data.push(p.data[j]);
                    var nid = p.data.length-1;
                    
                    p.data[i] = {
                        type: "unify",
                        data: [id, nid]
                    };
    
                    p.data[j] = {
                        type: "defer",
                        data: i
                    };
                }
                
                return i;
            }
        },
        "ignore": function (p, i, j) {
            return 0;
        },
        "unify": function (p, i, j) {
            return unify(p, j, i);
        }
    },
    "constant": {
        "defer": function (p, i, j) {
            return unify(p, j, i);
        },
        "tuple": function (p, i, j) {
            return unify(p, j, i);
        },
        "variable": function (p, i, j) {
            return unify(p, j, i);
        },
        "constant": function (p, i, j) {
            // fail: reason => to get to this point both constants must have diferent values (i!==j)
        },
        "not": function (p, i, j) {
            var r = cmp(p, i, p.data[j].data);
            
            if (r !== cmpCodes.EQUAL) {
                if (
                    (r === cmpCodes.VARIABLE)
                    || (r === cmpCodes.NOT)
                ) {
                    p.data.push(p.data[j]);
                    var id = p.data.length-1;
                    
                    p.data[j] = {
                        type: "unify",
                        data: [i, id]
                    };
                }
                else {
                    p.data[j] = {
                        type: "defer",
                        data: i
                    };
                }

                return i;
            }
        },
        "ignore": function (p, i, j) {
            return 0;
        },
        "unify": unifyTODO
    },
    "not": {
        "defer": function (p, i, j) {
            return unify(p, j, i);
        },
        "tuple": function (p, i, j) {
            return unify(p, j, i);
        },
        "variable": function (p, i, j) {
            return unify(p, j, i);
        },
        "constant": function (p, i, j) {
            return unify(p, j, i);
        },
        "not": function (p, i, j) {
            if (cmp(p, i, j) === cmpCodes.EQUAL) {
                p.data[j] = {
                    type: "defer",
                    data: i
                };
                
                return i;
            }

            return create(p, {type: "unify", data: [i, j]});
        },
        "ignore": function (p, i, j) {
            return 0;
        },
        "unify": function (p, i, j) {
            return unify(p, j, i);
        }
    },
    "ignore": {
        "defer": function (p, i, j) {
            return unify(p, j, i);
        },
        "tuple": function (p, i, j) {
            return unify(p, j, i);
        },
        "variable": function (p, i, j) {
            return unify(p, j, i);
        },
        "constant": function (p, i, j) {
            return unify(p, j, i);
        },
        "not": function (p, i, j) {
            return unify(p, j, i);
        },
        "ignore": function (p, i, j) {
            return 0;
        },
        "unify": function (p, i, j) {
            return unify(p, j, i);
        }
    }
};


function unify(p, i, j) {
    var id = i;

    if (i !== j) {
        id = unifyOp[p.data[i].type][p.data[j].type](p, i, j);
    }

    return id;
}

module.exports = unify;
