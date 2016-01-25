function CmpTODO (p, i, j) {
    console.log("TODO CMP: " + p.data[i].type + " === " + p.data[j].type);
}

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

var cmpOp = {
    "defer": {
        "defer": function (p, i, j) {
            return cmp(p, p.data[i].data, j);
        },
        "unify": function (p, i, j) {
            return cmp(p, p.data[i].data, j);
        },
        "tuple": function (p, i, j) {
            return cmp(p, p.data[i].data, j);
        },
        "variable": function (p, i, j) {
            return cmp(p, p.data[i].data, j);
        },
        "constant": function (p, i, j) {
            return cmp(p, p.data[i].data, j);
        },
        "not": function (p, i, j) {
            return cmp(p, p.data[i].data, j);
        },
        "ignore": function (p, i, j) {
            return cmp(p, p.data[i].data, j);
        },
    },
    "unify": {
        "defer": function (p, i, j) {
            return cmp(p, j, i);
        },
        "unify": function (p, i, j) {
            var a = p.data[i].data;
            var b = p.data[j].data;
            
            if (a.length === b.length) {
                a.sort();
                b.sort();
                
                for (var k=0; k<a.length; k++) {
                    var code = cmp(a[k], b[k]);
                    if (code !== cmpCodes.EQUAL) {
                        return code;
                    }
                }
                
                return cmpCodes.EQUAL;
            }

            return cmpCodes.UNIFY;
        },
        "tuple": function (p, i, j) {
            return cmpCodes.UNIFY;
        },
        "variable": function (p, i, j) {
            return cmpCodes.UNIFY;
        },
        "constant": function (p, i, j) {
            return cmpCodes.UNIFY;
        },
        "not": function (p, i, j) {
            return cmpCodes.UNIFY;
        },
        "ignore": function () {
            return cmpCodes.IGNORE;
        }
    },
    "variable": {
        "defer": function (p, i, j) {
            return cmp(p, j, i);
        },
        "unify": function (p, i, j) {
            return cmp(p, j, i);
        },
        "tuple": function () {
            return cmpCodes.VARIABLE;
        },
        "variable": function () {
            // fail, reason: to get here i !== j, so they are not equal.
            return cmpCodes.VARIABLE;
        },
        "constant": function () {
            return cmpCodes.VARIABLE;
        },
        "not": function () {
            return cmpCodes.VARIABLE;
        },
        "ignore": function () {
            return cmpCodes.IGNORE;
        }
    },
    "not": {
        "defer": function (p, i, j) {
            return cmp(p, j, i);
        },
        "unify": function (p, i, j) {
            return cmp(p, j, i);
        },
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
            return cmp(p, p.data[i].data, p.data[j].data);
        },
        "ignore": function () {
            return cmpCodes.IGNORE;
        }
    },
    "ignore": {
        "defer": function (p, i, j) {
            return cmp(p, j, i);
        },
        "unify": function (p, i, j) {
            return cmp(p, j, i);
        },
        "tuple": function () {
            return cmpCodes.IGNORE;
        },
        "variable": function (p, i, j) {
            return cmp(p, j, i);
        },
        "constant": function () {
            return cmpCodes.IGNORE;
        },
        "not": function () {
            return cmpCodes.IGNORE;
        },
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
            var a = p.data[i];
            var b = p.data[j];
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
        "variable": function (p, i, j) {
            return cmp(p, j, i);
        },
        "constant": function () {
            return cmpCodes.TUPLE;
        },
        "not": function (p, i, j) {
            return cmp(p, j, i);
        },
        "ignore": function (p, i, j) {
            return cmp(p, j, i);
        }
    },
    "constant": {
        "defer": function (p, i, j) {
            return cmp(p, j, i);
        },
        "unify": function (p, i, j) {
            return cmp(p, j, i);
        },
        "tuple": function (p, i, j) {
            return cmp(p, j, i);
        },
        "variable": function (p, i, j) {
            return cmp(p, j, i);
        },
        "constant": function (p, i, j) {
            if(p.data[i].data === p.data[j].data) {
                return cmpCodes.EQUAL;
            }

            return cmpCodes.VALUE;
        },
        "not": function (p, i, j) {
            return cmp(p, j, i);
        },
        "ignore": function (p, i, j) {
            return cmp(p, j, i);
        }
    }
};

function cmp (p, i, j) {
    if (i === j) {
        return cmpCodes.EQUAL;
    }
    else {
        return cmpOp[p.data[i].type][p.data[j].type](p, i, j);
    }
}

module.exports = {
    cmp: cmp,
    cmpCodes: cmpCodes
};
