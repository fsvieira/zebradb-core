var c = require("./cmp");
var utils = require("./utils");


var cmp = c.cmp;
var cmpCodes = c.cmpCodes;


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

        p.defer(j, i);
        
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
}

function _constant_constant (p, i, j) {
    var a = p.get(i);
    var b = p.get(j);

    // avoid defer, as its not needed for constant values.
    if (a.data === b.data) {
        return i;
    }
}

// -- lazy unify
function _not_not (p, i, j) {
    
    var a = p.get(i);
    var b = p.get(j);
    
    a.unify = a.unify || [];
    b.unify = b.unify || [];
    
    if (a.unify.indexOf(j) === -1) {
        a.unify.push(j);

        if (_unify_all(p, j, a.unify) === undefined) {
           // fail to unify with constrains.
            return;
        }
        
        listener(p, i, i);
    }
    
    if (b.unify.indexOf(i) === -1) {
        b.unify.push(i);

        if (_unify_all(p, i, b.unify) === undefined) {
            // fail to unify with constrains.
            return;
        }

        listener(p, j, j);
    }
    
    if (cmp(p, i, j) === cmpCodes.EQUAL) {
        if (i < j) {
            p.defer(j, i);
        }
        else {
            p.defer(i, j);
        }
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

        b.unify = b.unify || [];
        a.unify = a.unify || [];
            
        if (a.unify.indexOf(j) === -1) {
            a.unify.push(j);

            if (_unify_all(p, j, a.unify) === undefined) {
               // fail to unify with constrains.
                return;
            }
                
            listener(p, i, i);
        }

        if (b.unify.indexOf(i) === -1) {
            b.unify.push(i);

            if (_unify_all(p, i, b.unify) === undefined) {
                // fail to unify with constrains.
                return;
            }

            listener(p, j, j);
        }
        
        if (
            (r === cmpCodes.VARIABLE)
            || (r === cmpCodes.NOT)
        ) {

        }
        else {
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

    /*
        TODO:
         - equal should consider unifies...
    */

    if (r !== cmpCodes.EQUAL) {
        var v = p.get(j);
        
        v.unify = v.unify || [];

        if (v.unify.indexOf(i) === -1) {
            v.unify.push(i);

            if (_unify_all(p, i , v.unify) === undefined) {
                // fail to unify with constrains.
                return;
            }
                
            listener(p, j, j);
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
            return i<j?i:j;
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
    }
};

function unify(p, i, j) {
    var id = i;

/*
    var debug_1 = p.get(i);
    var debug_2 = p.get(j);
*/
/*
    console.log(
        "var s = " + JSON.stringify(p.snapshot()) + ";\n" +
        "var w = Writer.load(s);\n" +
        "unify(w, " + i + ", " + j + ");\n\n"
    );
*/
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
