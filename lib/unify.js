var c = require("./cmp");
var utils = require("./utils");


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


/*
    New Unify manage functions
*/
// Get unifies,
function unifies (p, i) {
    var data = p.get(i);
    var u;
    if (data.type === 'unify') {
        u = data.data;
    }
    else if (data.unify !== undefined) {
        u = p.get(data.unify).data;
    }
    
    return u;
}

// TODO: put this on writer.
function check_unifies (p, i, j) {
    if (!p.equal(i, j, true)) {
        p.setUnifies(i, j);

        return reunify(p, p.get(i), i);
    }

    // nothing to do.
    return true;
}

function equal_unifies(p, i, j) {
    if (!p.equal(i, j, true)) {
        // since i and j are sintax equal, we can unify without checking.
        /*var iu = unifies(p, i);
        var ju = unifies(p, j);

        var r = (iu || [i]).concat(ju || [j]);
        // set all ju's to iu,
        p.setUnifies(j, i, r);*/
        p.setUnifies(i, j);
    }
    
    return true;
}

function reunify (p, v, i) {
    // console.log("Reunify");

    var u = p.get(v.unify);
    for (var k=0; k<u.data.length; k++) {
        if (unify(p, i, u.data[k]) === undefined) {
            return false;
        }
    }

    return true;
}

/*
    TODO: 
        lazzy remove notify, 
        must pass a way to make notifies undefined.
        OR check for notify 0 lazzy.
    PROBLEM:
        - lazzy remove notify may block new listenner from 
        reset all tuples again.
*/
function notify (p, notifies) {
    if (notifies && notifies.length > 0) {
        // console.log("Notify");

        for (var i=notifies.length-1; i>0; i--) {
            var n = notifies[i];
            var v = p.get(n);
    
            if (v.unify) {
                if (!reunify(p, v, n)) {
                    return false;
                }
            }
            /*
            else {
                // TODO: check why remove unifies are not working on defer value.
                // TODO: remove notifies when tuples get their values.
                notifies.splice(i, 1);
            }*/
        }
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
    var n = p.get(i).notify;
    p.defer(i, j);
    
    if (notify(p, n)) {
        return j;
    }
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

        if (check_unifies(p, i, j)) {
            p.defer(j, i);
            return i;
        }
        
        if (notify(p, a.notify) && notify(p, b.notify)) {
            return i;
        }
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
    var a = p.get(i);
    var b = p.get(j);

    if (cmp(p, i, j) === cmpCodes.EQUAL) {
        if (equal_unifies(p, i, j)) {
            if (i < j) {
                p.defer(j, i);
            }
            else {
                p.defer(i, j);
            }
        }
    }
    else if (!check_unifies(p, i, j)) {
        return;
    }

    if (notify(p, a.notify) && notify(p, b.notify)) {
        return i<j?i:j;
    }
}


function _tuple_not (p, i, j) {
    var r = cmp(p, i, p.get(j).data);

    if (r !== cmpCodes.EQUAL) {
        var a = p.get(i);
        var b = p.get(j);

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
            p.defer(j, i);
        }

        if (notify(p, a.notify) && notify(p, b.notify)) {
            return i<j?i:j;
        }
    }
}

function _constant_not (p, i, j) {
    var r = cmp(p, i, p.get(j).data);

    if (r !== cmpCodes.EQUAL) {
        var v = p.get(j);

        if (!check_unifies(p, i, j)) {
            return;
        }

        if (
            (r === cmpCodes.VARIABLE)
            || (r === cmpCodes.NOT)
        ) {
            return j;
        }
        else {
            p.defer(j, i);
        }

        if (notify(p, v.notify)) {
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
