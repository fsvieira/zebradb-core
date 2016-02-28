
var cmpCodes = {
    EQUAL: 0,
    // fail codes:
    VALUE: 1,
    CONSTANT: 2,
    VARIABLE: 3,
    NOT: 4,
    TUPLE: 5,
    UNIFY: 6,
    IGNORE: 7
};

// TODO: make sure compare is a sintax compare, not semantic compare, much easier to manage.
// Leave semantic to unify. Except for "defer", they should be followed and ignored.

function _defer_X (p, i, j) {
    return cmp(p, p.get(i).data, j);
}

function _invert (p, i, j) {
    return cmp(p, j, i);
}

function _return_unify () {
    return cmpCodes.UNIFY;
}

function _return_variable () {
    return cmpCodes.VARIABLE;
}

function _return_ignore () {
    return cmpCodes.IGNORE;
}

var cmpOp = {
    "defer": {
        "defer": _defer_X,
        "unify": _defer_X,
        "tuple": _defer_X,
        "variable": _defer_X,
        "constant": _defer_X,
        "not": _defer_X,
        "ignore": _defer_X
    },
    "unify": {
        "defer": _invert,
        "unify": function (p, i, j) {
            var a = p.get(i).data.slice(0);
            var b = p.get(j).data.slice(0);
            
            if (a.length === b.length) {
                a.sort();
                b.sort();
                
                for (var k=0; k<a.length; k++) {
                    var code = cmp(p, a[k], b[k]);
                    if (code !== cmpCodes.EQUAL) {
                        return code;
                    }
                }
                
                return cmpCodes.EQUAL;
            }

            return cmpCodes.UNIFY;
        },
        "tuple": _return_unify,
        "variable": _return_unify,
        "constant": _return_unify,
        "not": _return_unify,
        "ignore": _return_unify
    },
    "variable": {
        "defer": _invert,
        "unify": _invert,
        "tuple": _return_variable,
        "variable": _return_variable,
        "constant": _return_variable,
        "not": _return_variable,
        "ignore": _return_ignore
    },
    "not": {
        "defer": _invert,
        "unify": _invert,
        "tuple": function (p, i, j) {
            return cmpCodes.NOT;
        },
        "variable": function (p, i, j) {
            return cmp(p, j, i);
        },
        "constant": function () {
            return cmpCodes.NOT;
        },
        "not": function (p, i, j) {
            return cmp(p, p.get(i).data, p.get(j).data);
        },
        "ignore": _return_ignore
    },
    "ignore": {
        "defer": function (p, i, j) {
            return cmp(p, j, i);
        },
        "unify": function (p, i, j) {
            return cmp(p, j, i);
        },
        "tuple": _return_ignore,
        "variable": function (p, i, j) {
            return cmp(p, j, i);
        },
        "constant": _return_ignore,
        "not":_return_ignore,
        "ignore": function () {
            return cmpCodes.EQUAL;
        }
    },
    "tuple": {
        "defer": function (p, i, j) {
            return cmp(p, j, i);
        },
        "unify": function (p, i, j) {
            return cmp(p, j, i);
        },
        "tuple": function (p, i, j) {
            var a = p.get(i);
            var b = p.get(j);
            var code = cmpCodes.VALUE;
            
            if (a.data.length === b.data.length) {
                code = cmpCodes.EQUAL;
                for (var k=0; k<a.data.length; k++) {
                    code = cmp(p, a.data[k], b.data[k]);
                    if (code && (code !== cmpCodes.VARIABLE) && (code !== cmpCodes.IGNORE)) {
                        break; 
                    }
                }
            }
            
            return code;
        },
        "variable": _invert,
        "constant": function () {
            return cmpCodes.TUPLE;
        },
        "not": _invert,
        "ignore": _invert
    },
    "constant": {
        "defer": _invert,
        "unify": _invert,
        "tuple": _invert,
        "variable": _invert,
        "constant": function (p, i, j) {
            if(p.get(i).data === p.get(j).data) {
                return cmpCodes.EQUAL;
            }

            return cmpCodes.VALUE;
        },
        "not": _invert,
        "ignore": _invert
    }
};


function cmp (p, i, j) {
    if (p.equal(i,j)) {
        return cmpCodes.EQUAL;
    }
    else {
        return cmpOp[p.get(i).type][p.get(j).type](p, i, j);
    }
}

module.exports = {
    cmp: cmp,
    cmpCodes: cmpCodes
};
