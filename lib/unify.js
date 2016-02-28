var c = require("./cmp");
var utils = require("./utils");


var cmp = c.cmp;
var cmpCodes = c.cmpCodes;


var _invert,
    _variable_X,
    _ignore,
    _unify_X,
    _fail,
    _not_not,
    _tuple_tuple,
    _tuple_not,
    _constant_not,
    _constant_constant,
    _unify_unify;

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

/*
_unify_unify = function (p, i, j) {
    var a = p.get(i);
    var b = p.get(j);
    
    var data = a.data.concat(b.data);

    for (var ka=data.length-1; ka>0; ka--) {
        var da = data[ka];
        for (var kb=ka-1; kb>=0; kb--) {
            var r = unify(p, da, data[kb]);
            
            if (r !== undefined) {
                var v = p.get(r);
                if (v.type !== "unify") {
                    // save unification result,
                    data[kb] = v;
                    // remove "duplicated" value,
                    data.splice(ka, 1);
                    break;
                }
                // else ignore.
            }
            else {
                return;
            }
        }
    }
    
    a.data = data;
    b.data = data;


    if (data.length === 1) {
        p.set(j, { 
            type: "defer",
            data: data[0]
        });
        
        p.set(i, { 
            type: "defer",
            data: data[0]
        });
    }
    else {
        p.set(i, { 
            type: "defer",
            data: j
        });
    }
    
    return j;
};
*/

/*
_unify_unify = _unify_X = function (p, i, j) {
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
*/

/*
    TODO:
        - Problem, since we are using union to unify independente parts of the 
        result, some variables inside tuples may change their value, but since 
        unify is not aware of this change, it doenst evaluate the expression.
        
        - This is a problem because results should fail or succed early, lazzy eval
        may result in a infinit loop.
        
        - In the future, the system should be aware of such changes and deal with 
        them accordonaly.
        
        - for now as a proof of concept it should reunify all lazy-unify on every
        unify success.
        
    -- Still this function is not yet working as it should.
*/
function __reunify (p) {
    var u = p.getUnifies ();
    for (var i=0; i<u.length; i++) {
        if (_reunify(p, u[i]) === undefined) {
            return;
        }
    }
}

/*
    TODO:
        1) remove all equals,
        2) U (a, b)
            - check if it will generate a unify, if yes dismiss,
            - if not unify, remove a, b and put result.
*/

function _reunify (p, i) {
    var a = p.get(i);

    // clean equals,
    for (var k=a.data.length-1; k>0; k--) {
        for (var k2=k-1; k2>=0; k2--) {
            if (p.equal(a.data[k], a.data[k2])) {
                // remove it.
                a.data.splice(k, 1);
            }
            else if (cmp(p, a.data[k], a.data[k2]) === cmpCodes.EQUAL) {
                p.set(a.data[k], {
                    type: "defer",
                    data: a.data[k2]
                });
                
                a.data.splice(k, 1);
            }
        }
    }
    
    // reunify everything,
    var v = a.data[0];
    for (var k=1; k<a.data.length; k++) {
        v = unify(p, v, a.data[k]);
        if (v === undefined) {
            return;
        }
    }

    if (!p.equal(v, i)) {
        p.set(i, {
            type: "defer",
            data: v
        });
    }
    
    return v;
}

/*
_unify_unify = function (p, i, j) {
    p.get(i).data.concat(p.get(j).data);
    
    p.set(j, {
        type: "defer",
        data: i
    });
    
    return _reunify(p, i);
};

_unify_X = function (p, i, j) {
    p.get(i).data.push(j);
    return _reunify(p, i);
};
*/

_unify_unify = function (p, i, j) {
    return _unify_X(p, i, j);
};

_unify_X = function (p, i, j) {
    var a = p.get(i);

    for (var k=0; k<a.data.length; k++) {
        if (cmp(p, a.data[k], j) === cmpCodes.EQUAL) {
            p.set(j, {
                type: "defer",
                data: i
            });

            return i;
        }
    }
    
    // no equals found,
    var v = j;
    for (var k=0; k<a.data.length; k++) {
        v = unify(p, a.data[k], v);
        if (v === undefined) {
            return;
        }
    }

    if (!p.equal(v, j)) {
        p.set(j, {
            type: "defer",
            data: v
        });
    }
    
    if (!p.equal(v, i)) {
        p.set(i, {
            type: "defer",
            data: v
        });
    }
    
    return v;
};


_fail = function (p, i, j) {
    // fail: reason => to get to this point both constants must have diferent values (i!==j)
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


_constant_constant = function (p, i, j) {
    var a = p.get(i);
    var b = p.get(j);

    // avoid defer, as its not needed for constant values.
    if (a.data === b.data) {
        return i;
    }
};


// -- Lazy unify --
/*
    TODO:
        - Avoid unify creation/duplicates.
*/
_not_not = function (p, i, j) {
    if (cmp(p, i, j) === cmpCodes.EQUAL) {
        p.set(j, {
            type: "defer",
            data: i
        });
        
        return i;
    }
    
    p.set(i, {
        type: "unify",
        data: [p.add(p.get(i)), p.add(p.get(j))]
    });
    
    p.set(j, {
        type: "defer",
        data: i
    });
    
    return i;
};


_tuple_not = function (p, i, j) {
    var r = cmp(p, i, p.get(j).data);
            
    if (r !== cmpCodes.EQUAL) {
        if (
            (r === cmpCodes.VARIABLE)
            || (r === cmpCodes.NOT)
            // || (r === cmpCodes.UNIFY)
        ) {
            p.set(i, {
                type: "unify",
                data: [p.add(p.get(i)), p.add(p.get(j))]
            });
            
            p.set(j, {
                type: "defer",
                data: i
            });
        }
                
        return i;
    }
};

_constant_not = function (p, i, j) {
    var r = cmp(p, i, p.get(j).data);

    if (r !== cmpCodes.EQUAL) {
        if (
            (r === cmpCodes.VARIABLE)
            || (r === cmpCodes.NOT)
            // || (r === cmpCodes.UNIFY)
        ) {
            p.set(j, {
                type: "unify",
                data: [i, p.add(p.get(j))]
            });
        }
        else {
            p.set(j, {
                type: "defer",
                data: i
            });
        }

        return i;
    }
};


var unifyOp = {
    /*
    "defer": {
        "defer": _defer_defer,
        "tuple": _defer_X,
        "variable": _defer_X,
        "constant": _defer_X,
        "not": _defer_X,
        "ignore": _defer_X,
        "unify": _defer_X
    },*/
    "unify": {
        "defer": _invert,
        "unify": _unify_unify,
        "tuple": _unify_X,
        "variable": _unify_X,
        "constant": _unify_X,
        "not": _unify_X,
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

    var debug_1 = p.get(i);
    var debug_2 = p.get(j);
    
    var s = "";

//    if (debug_1.type === 'unify' && debug_2.type === 'tuple') {
 //       s = "#" + i + " ==> " + JSON.stringify(debug_1) + " ** #" + j + " ==> " + JSON.stringify(debug_2);
/*        console.log(s);
    }
*/

    if (!p.equal(i, j)) {
        id = unifyOp[p.get(i).type][p.get(j).type](p, i, j);
    }

/*    
    if (s !== "") {
        console.log(s + " = #" + id + " ==> " + (id===undefined?"undefined":JSON.stringify(p.get(id))));
    }
*/
//    console.log(s + " = #" + id + " ==> " + (id===undefined?"undefined":JSON.stringify(p.get(id))));

    return id;
}

module.exports = unify;
