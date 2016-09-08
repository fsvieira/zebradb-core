var c = require("./cmp");
var logger = require("./logger");

var cmp = c.cmp;
var cmpCodes = c.cmpCodes;


var Unify = {};


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
Unify.check_unifies = function (p, i, j) {
    if (p.setUnifies(i, j)) {
        return Unify.reunify(p, p.get(i).unify);
    }
    // nothing to do.
    return true;
};

Unify.reunify = function(p, v) {
    if (v !== undefined) {
        var u = p.get(v);

        // TODO: the unify does take elements from the array so we need to clone it,
        // would this have a bug? impact on performance ? 
        var cdata = u.data.slice(0);
        for (var ki=0; ki<cdata.length-1; ki++) {
            for (var kj=ki+1; kj<cdata.length; kj++) {
                if (Unify.unify(p, cdata[ki], cdata[kj]) === undefined) {
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
};

Unify._unify_unify = function (p, i, j) {
    if (Unify.check_unifies(p, i, j)) {
        return i;   
    }
};

Unify._unify_tuple = function (p, i, j) {
    if (Unify.check_unifies(p, i, j)) {
        return i;
    }
};

/*
    Unify Terms functions,
*/
Unify._invert = function (p, i, j) {
    return Unify.unify(p, j, i);
};

Unify._ignore = function () {
    return 0;
};

// --
Unify._variable_X = function (p, i, j) {
    // var n = p.get(i).notify;
    if (p.defer(i, j)) {
        return j;
    }
    
    /*
    if (notify(p, n)) {
        return j;
    }*/
};

Unify._fail = function (p, i, j) {
    // fail: reason => to get to this point both constants must have diferent values (i!==j)
};

Unify._tuple_tuple = function (p, i, j) {
    var a = p.get(i);
    var b = p.get(j);
    
    if (a.data.length === b.data.length) {
        for (var k=0; k<a.data.length; k++) {
            a.data[k] = Unify.unify(p, a.data[k], b.data[k]);
            if (a.data[k] === undefined) {
                return;
            }
        }

        var check = a.check || b.check;
        a.check = check;
        b.check = check;

        if (Unify.check_unifies(p, i, j) && p.defer(i, j)) {
            return j;
        }
        
        /*
        if (notify(p, a.notify) && notify(p, b.notify)) {
            return i;
        }*/
    }
};

Unify._constant_constant = function (p, i, j) {
    var a = p.get(i);
    var b = p.get(j);

    if (a.data === b.data) {
        return i;
    }
};

// -- lazy unify
Unify._not_not = function (p, i, j) {
    // var a = p.get(i);
    // var b = p.get(j);

    if (cmp(p, i, j) === cmpCodes.EQUAL) {
        p.setUnifies(i, j);

        if (p.defer(i, j)) {
            return j;
        }
    }
    else if (Unify.check_unifies(p, i, j)) {
        return j;
    }

    /*if (notify(p, a.notify) && notify(p, b.notify)) {
        return i<j?i:j;
    }*/
};


Unify._tuple_not = function (p, i, j) {
    var r = cmp(p, i, p.get(j).data);

    if (r !== cmpCodes.EQUAL) {
        if (!Unify.check_unifies(p, i, j)) {
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
};

Unify._constant_not = function (p, i, j) {
    var r = cmp(p, i, p.get(j).data);

    if (r !== cmpCodes.EQUAL) {
        if (!Unify.check_unifies(p, i, j)) {
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
};

Unify.unify = function (p, i, j) {
    var id = i;

    if (!p.equal(i, j)) {
        id = unifyOp[p.get(i).type][p.get(j).type](p, i, j);
    }

    return id;
};

logger(Unify, "unify");

var unifyOp = {
    "variable": {
        "tuple": Unify._variable_X,
        "variable": Unify._variable_X,
        "constant": Unify._variable_X,
        "not": Unify._variable_X,
        "ignore": Unify._ignore,
        "unify": Unify._invert
    },
    "tuple": {
        "tuple": Unify._tuple_tuple,
        "variable": Unify._invert,
        "constant": Unify._fail,
        "not": Unify._tuple_not,
        "ignore": Unify._ignore,
        "unify": Unify._invert
    },
    "constant": {
        "tuple": Unify._invert,
        "variable": Unify._invert,
        "constant": Unify._constant_constant,
        "not": Unify._constant_not,
        "ignore": Unify._ignore,
        "unify": Unify._invert
    },
    "not": {
        "tuple": Unify._invert,
        "variable": Unify._invert,
        "constant": Unify._invert,
        "not": Unify._not_not,
        "ignore": Unify._ignore,
        "unify": Unify._invert
    },
    "ignore": {
        "tuple": Unify._invert,
        "variable": Unify._invert,
        "constant": Unify._invert,
        "not": Unify._invert,
        "ignore": Unify._ignore,
        "unify": Unify._invert
    },
    "unify": {
        "unify": Unify._unify_unify,
        "tuple": Unify._unify_tuple
    }
};

module.exports = Unify;
