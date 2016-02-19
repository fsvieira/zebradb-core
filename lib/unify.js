var c = require("./cmp");
var utils = require("./utils");


var cmp = c.cmp;
var cmpCodes = c.cmpCodes;


var _defer_defer, 
    _defer_X,
    _invert,
    _variable_X,
    _ignore,
    _unify_unify,
    _fail,
    _not_not,
    _tuple_tuple,
    _tuple_not,
    _constant_not,
    _constant_constant;

_defer_defer = function (p, i, j) {
    var d = unify(p, p.get(i).data, p.get(j).data);
    p.get(i).data = d;
    p.get(j).data = d;
            
    return d;
};

_defer_X = function (p, i, j) {
    var d = unify(p, p.get(i).data, j);
    p.get(i).data = d;
            
    return d;
};

_invert = function (p, i, j) {
    return unify(p, j, i);
};

_ignore = function () {
    return 0;
};

// --
_variable_X = function (p, i, j) {
    p.set(i, {
        type: 'defer',
        data: j
    });
    
    return j;
};

_unify_unify = function (p, i, j) {
    var u = p.get(i);
    for (var k=0; k<u.data.length; k++) {
        if (unify(p, u.data[k], j) === undefined) {
            return;
        }
    }
           
    p.set(i, { 
        type: "defer",
        data: j
    });
    
    return j;
};

_fail = function (p, i, j) {
    // fail: reason => to get to this point both constants must have diferent values (i!==j)
};

_not_not = function (p, i, j) {
    if (cmp(p, i, j) === cmpCodes.EQUAL) {
        p.set(j, {
            type: "defer",
            data: i
        });
        
        return i;
    }

    return p.add({type: "unify", data: [i, j]});
};

_tuple_tuple = function (p, i, j) {
    var a = p.get(i);
    var b = p.get(j);
            
    if (a.data.length === b.data.length) {
        for (var k=0; k<a.data.length; k++) {
            a.data[k] = unify(p, a.data[k], b.data[k]);
            if (a.data[k] === undefined) {
                return;
            }
        }
                
        var check = a.check || b.check;
        a.check = check;
        
        p.set(j, {
            type: "defer",
            data: i
        });
        
        return i;
    }
};

_tuple_not = function (p, i, j) {
    var r = cmp(p, i, p.get(j).data);
            
    if (r !== cmpCodes.EQUAL) {
        if (
            (r === cmpCodes.VARIABLE)
            || (r === cmpCodes.NOT)
        ) {
            /*
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
            };*/

            p.set(i, {
                type: "unify",
                data: [p.add(p.get(i)), p.add(p.get(i))]
            });
            
            p.set(j, {
                type: "defer",
                data: i
            });
        }
                
        return i;
    }
};

_constant_constant = function (p, i, j) {
    var a = p.get(i);
    var b = p.get(j);

    // avoid defer, as its not needed for constant values.
    if (a.data === b.data) {
        return i;
    }
};

_constant_not = function (p, i, j) {
    var r = cmp(p, i, p.get(j).data);

    if (r !== cmpCodes.EQUAL) {
        if (
            (r === cmpCodes.VARIABLE)
            || (r === cmpCodes.NOT)
        ) {
            /*p.data.push(p.data[j]);
            var id = p.data.length-1;
                    
            p.data[j] = {
                type: "unify",
                data: [i, id]
            };*/
            p.set(j, {
                type: "unify",
                data: [i, p.add(p.get(j))]
            });
        }
        else {
            /*
            p.data[j] = {
                type: "defer",
                data: i
            };
            */
            p.set(j, {
                type: "defer",
                data: i
            });
        }

        return i;
    }
};


var unifyOp = {
    "defer": {
        "defer": _defer_defer,
        "tuple": _defer_X,
        "variable": _defer_X,
        "constant": _defer_X,
        "not": _defer_X,
        "ignore": _defer_X,
        "unify": _defer_X
    },
    "unify": {
        "defer": _invert,
        "unify": _unify_unify,
        "tuple": _unify_unify,
        "variable": _unify_unify,
        "constant": _unify_unify,
        "not": _unify_unify,
        "ignore": _ignore
    },
    "variable": {
        "defer": _invert,
        "tuple": _variable_X,
        "variable": _variable_X,
        "constant": _variable_X,
        "not": _variable_X,
        "ignore": _ignore,
        "unify": _invert
    },
    "tuple": {
        "defer": _invert,
        "tuple": _tuple_tuple,
        "variable": _invert,
        "constant": _fail,
        "not": _tuple_not,
        "ignore": _ignore,
        "unify": _invert
    },
    "constant": {
        "defer": _invert,
        "tuple": _invert,
        "variable": _invert,
        "constant": _constant_constant,
        "not": _constant_not,
        "ignore": _ignore,
        "unify": _invert
    },
    "not": {
        "defer": _invert,
        "tuple": _invert,
        "variable": _invert,
        "constant": _invert,
        "not": _not_not,
        "ignore": _ignore,
        "unify": _invert
    },
    "ignore": {
        "defer": _invert,
        "tuple": _invert,
        "variable": _invert,
        "constant": _invert,
        "not": _invert,
        "ignore": _ignore,
        "unify": _invert
    }
};

function unify(p, i, j) {
    var id = i;

    var s = "\t" + utils.table2string(p.commit(), i) + " ** " + utils.table2string(p.commit(), j);

    if (i !== j) {
        id = unifyOp[p.get(i).type][p.get(j).type](p, i, j);
    }

    if (id === undefined) {
        console.log(s + " = undefined");
    }
    else {
        console.log(s + " = " + utils.table2string(p.commit(), id));
    }

    return id;
}

module.exports = unify;
