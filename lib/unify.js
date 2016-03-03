var c = require("./cmp");
var utils = require("./utils");


var cmp = c.cmp;
var cmpCodes = c.cmpCodes;


var _variable_X,
    _unify_X,
    _fail,
    _not_not,
    _tuple_tuple,
    _tuple_not,
    _constant_not,
    _constant_constant,
    _unify_unify;

/*
    Unify manage functions,
*/

// Unify i with all unifies, works as a constrain check and lazy eval.
function _unify_all (p, i, unifies) {
    if (unifies !== undefined) {
        
        for (var k=0; k<unifies.length; k++) {
            if (unify(p, i, unifies[k]) === undefined) {
                return;   
            }
        }
    }

    return i;
}


function reunify (p, i) {
    var v = p.get(i);
    return _unify_all(p, i, v.unifies);
}

function listener (p, n, i) {
    var v = p.get(i);
    
    if (v.type === 'tuple') {
        for (var j=0; j<v.data.length; j++) {
            notify(p, n, v.data[j]);
        }
    }
    else if (v.type === 'variable' || v.type === 'not') {
        if (n !== i) {
            v.notify = v.notify || [];
            if (v.notify.indexOf(n) === -1) {
                v.notify.push(n);
            }
        }
    }
}

function notify (p, notifies) {
    if (notifies) {
        for (var i=0; i<notifies.length; i++) {
            if (reunify(p, notifies[i]) === undefined) {
                return false;
            }
        }
    }
    
    return true;
}

/*
    Unify Terms functions,
*/
function _invert (p, i, j) {
    return unify(p, j, i);
}

function _ignore () {
    return 0;
}

// --
_variable_X = function (p, i, j) {
    var n = p.get(i).notify;
    
    p.set(i, {
        type: 'defer',
        data: j
    });
    
    if (notify(p, n)) {
        return j;
    }
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
        
        if (_unify_all(p, i, a.unify) === undefined) {
            // fail to unify with constrains.
            return;
        }

        if (_unify_all(p, i, b.unify) === undefined) {
            // fail to unify with constrains.
            return;
        }
        
        if (notify(p, a.notify) && notify(p, b.notify)) {
            return i;
        }

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

// -- lazy unify
_not_not = function (p, i, j) {
    
    if (cmp(p, i, j) === cmpCodes.EQUAL) {
        p.set(j, {
            type: "defer",
            data: i
        });
        
        return i;
    }

    var a = p.get(i);
    var b = p.get(j);
    
    a.unify = a.unify || [];
    b.unify = b.unify || [];
    
    if (a.unify.indexOf(j) === -1) {
        if (_unify_all(p, j, a.unify) === undefined) {
           // fail to unify with constrains.
            return;
        }
        
        a.unify.push(j);
        listener(p, i, i);
    }
    
    if (b.unify.indexOf(i) === -1) {
        if (_unify_all(p, i, b.unify) === undefined) {
            // fail to unify with constrains.
            return;
        }

        b.unify.push(i);
        listener(p, j, j);
    }
    
    if (notify(p, a.notify) && notify(p, b.notify)) {
        return i<j?i:j;
    }
};


_tuple_not = function (p, i, j) {
    var r = cmp(p, i, p.get(j).data);
            
    if (r !== cmpCodes.EQUAL) {
        var a = p.get(i);
        var b = p.get(j);

        b.unify = b.unify || [];
        a.unify = a.unify || [];
            
        if (a.unify.indexOf(j) === -1) {
            if (_unify_all(p, j, a.unify) === undefined) {
               // fail to unify with constrains.
                return;
            }
                
            a.unify.push(j);
            listener(p, i, i);
        }

        if (b.unify.indexOf(i) === -1) {
            if (_unify_all(p, i, b.unify) === undefined) {
                // fail to unify with constrains.
                return;
            }

            b.unify.push(i);
            listener(p, j, j);
        }
        
        if (
            (r === cmpCodes.VARIABLE)
            || (r === cmpCodes.NOT)
        ) {

        }
        else {
            // not as a variable eval as a value.
            p.set(j, {
                type: "defer",
                data: i
            });
        }
        
        if (notify(p, a.notify) && notify(p, b.notify)) {
            return i<j?i:j;
        }
    }
};


_constant_not = function (p, i, j) {
    var r = cmp(p, i, p.get(j).data);

    /*
        TODO:
         - equal should consider unifies...
    */

    if (r !== cmpCodes.EQUAL) {
        var v = p.get(j);
        
        v.unify = v.unify || [];

        if (v.unify.indexOf(i) === -1) {
            if (_unify_all(p, i , v.unify) === undefined) {
                // fail to unify with constrains.
                return;
            }
                
            v.unify.push(i);
            listener(p, j, j);
        }
            
        if (
            (r === cmpCodes.VARIABLE)
            || (r === cmpCodes.NOT)
        ) {
            
        }
        else {
            p.set(j, {
                type: "defer",
                data: i
            });
        }

        if (notify(p, v.notify)) {
            return i<j?i:j;
        }
    }
};


var unifyOp = {
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
    
    /*
    var s = "";
    s = "#" + i + " ==> " + JSON.stringify(debug_1) + " ** #" + j + " ==> " + JSON.stringify(debug_2);
    console.log(s);
    */

    if (!p.equal(i, j)) {
        id = unifyOp[p.get(i).type][p.get(j).type](p, i, j);
    }

    // console.log(s + " = #" + id + " ==> " + (id===undefined?"undefined":JSON.stringify(p.get(id))));

    return id;
}

module.exports = unify;
