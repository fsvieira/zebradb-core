var c = require("./cmp");

var cmp = c.cmp;
var cmpCodes = c.cmpCodes;

/*
    Specialized compare,
    - Function:
        * _not_not, compare:
            - If they are equal than they are the same (defer)
        * _tuple_not, compare:
            - if they are equal fail (data),
            - if they are not equal because of variables/nots then nothing can be assumed (lazzy unify)
        * _constant_not
            - if they are equal fail,
            - if they are not equal because of variables/nots then nothing can be assumed (lazzy unify)
    
    - cmp unify:
        * equal: if at least one is equal.
        * notEqual: if at least one is not equal.
        
    - Equal by value can lead to diferent unify's, this must be normalized on defer function.
*/

// TODO: put this on writer.
function check_unifies (p, i, j) {
    if (p.setUnifies(i, j)) {
        return reunify(p, p.get(i).unify);
    }
    // nothing to do.
    return true;
}

function reunify (p, v) {
    if (v !== undefined) {
        var u = p.get(v);

        // TODO: the unify does take elements from the array so we need to clone it,
        // would this have a bug? impact on performance ? 
        var cdata = u.data.slice(0);
        for (var ki=0; ki<cdata.length-1; ki++) {
            for (var kj=ki+1; kj<cdata.length; kj++) {
                if (unify(p, cdata[ki], cdata[kj]) === undefined) {
                    return false;
                }
            }
        }
/*
        for (var ki=0; ki<u.data.length-1; ki++) {
            for (var kj=ki+1; kj<u.data.length; kj++) {
                var l = u.data.length;
                if (unify(p, u.data[ki], u.data[kj]) === undefined) {
                    return false;
                }
                
                if (l !== u.data.length) {
                    // reset.
                    ki--;
                    break;
                }
            }
        }
*/
    }
    
    return true;
}

function _unify_unify (p, i, j) {
    if (check_unifies(p, i, j)) {
        return i;   
    }
}

function _unify_tuple (p, i, j) {
    if (check_unifies(p, i, j)) {
        return i;
    }
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
function _variable_X (p, i, j) {
    // var n = p.get(i).notify;
    if (p.defer(i, j)) {
        return j;
    }
    
    /*
    if (notify(p, n)) {
        return j;
    }*/
}

function _fail (p, i, j) {
    // fail: reason => to get to this point both constants must have diferent values (i!==j)
}

function _tuple_tuple (p, i, j) {
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
        b.check = check;

        if (check_unifies(p, i, j) && p.defer(i, j)) {
            return j;
        }
        
        /*
        if (notify(p, a.notify) && notify(p, b.notify)) {
            return i;
        }*/
    }
}

function _constant_constant (p, i, j) {
    var a = p.get(i);
    var b = p.get(j);

    if (a.data === b.data) {
        return i;
    }
}

// -- lazy unify
function _not_not (p, i, j) {
    // var a = p.get(i);
    // var b = p.get(j);

    if (cmp(p, i, j) === cmpCodes.EQUAL) {
        p.setUnifies(i, j);

        if (p.defer(i, j)) {
            return j;
        }
    }
    else if (check_unifies(p, i, j)) {
        return j;
    }

    /*if (notify(p, a.notify) && notify(p, b.notify)) {
        return i<j?i:j;
    }*/
}


function _tuple_not (p, i, j) {
    var r = cmp(p, i, p.get(j).data);

    if (r !== cmpCodes.EQUAL) {
        if (!check_unifies(p, i, j)) {
            return;
        }
        
        if (
            !(
                (r === cmpCodes.VARIABLE)
                || (r === cmpCodes.NOT)
            )
        ) {
            // not as a variable eval as a value.
            if (p.defer(j, i)) {
                return i;
            }
        }
        
        return i;
    }
}

function _constant_not (p, i, j) {
    var r = cmp(p, i, p.get(j).data);

    if (r !== cmpCodes.EQUAL) {
        if (!check_unifies(p, i, j)) {
            return;
        }

        if (
            (r === cmpCodes.VARIABLE)
            || (r === cmpCodes.NOT)
        ) {
            return j;
        }
        else if (p.defer(j, i)){
            return i;
        }
    }
}


var unifyOp = {
    "variable": {
        "tuple": _variable_X,
        "variable": _variable_X,
        "constant": _variable_X,
        "not": _variable_X,
        "ignore": _ignore,
        "unify": _invert
    },
    "tuple": {
        "tuple": _tuple_tuple,
        "variable": _invert,
        "constant": _fail,
        "not": _tuple_not,
        "ignore": _ignore,
        "unify": _invert
    },
    "constant": {
        "tuple": _invert,
        "variable": _invert,
        "constant": _constant_constant,
        "not": _constant_not,
        "ignore": _ignore,
        "unify": _invert
    },
    "not": {
        "tuple": _invert,
        "variable": _invert,
        "constant": _invert,
        "not": _not_not,
        "ignore": _ignore,
        "unify": _invert
    },
    "ignore": {
        "tuple": _invert,
        "variable": _invert,
        "constant": _invert,
        "not": _invert,
        "ignore": _ignore,
        "unify": _invert
    },
    "unify": {
        "unify": _unify_unify,
        "tuple": _unify_tuple
    }
};

/*
for (var a in unifyOp) {
    for (var b in unifyOp[a]) {
        unifyOp[a][b] = (function (f, a, b) {
            return function (p, i, j) {
                console.log(a + "*" + b);
                p.debug_check("START[" + a +"][" + b + "] ");
                var r = f(p, i, j);
                p.debug_check("END[" + a +"][" + b + "] ");
                return r;
            };
        }(unifyOp[a][b], a, b));
    }
}
*/

function unify(p, i, j) {
    var id = i;

    if (!p.equal(i, j)) {
        id = unifyOp[p.get(i).type][p.get(j).type](p, i, j);
    }

    return id;
}

module.exports = unify;
