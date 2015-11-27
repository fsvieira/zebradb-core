function fail (p, i, q, j, ids) {
    console.log("TODO FAIL CMP: " + p.data[i].type + " === " + q.data[j].type);
}

function CmpTODO (p, i, q, j, ids) {
    console.log("TODO CMP: " + p.data[i].type + " === " + q.data[j].type);
}

var cmpOp = {
    "defer": {
        "defer": CmpTODO,
        "tuple": CmpTODO,
        "variable": CmpTODO,
        "constant": CmpTODO,
        "not": CmpTODO,
        "ignore": CmpTODO
    },
    "tuple": {
        "defer": CmpTODO,
        "tuple": function (p, i, q, j, ids) {
            var a = p.data[i];
            var b = q.data[j];
            
            if (a.data.length === b.data.length) {
                for (var k=0; k<a.data.length; k++) {
                    if (!cmp(p, a.data[k], q, b.data[k])) {
                        return false;
                    }
                }
                
                return true;
            }
            
            return false;
        },
        "variable": fail,
        "constant": fail,
        "not": fail,
        "ignore": fail
    },
    "variable": {
        "defer": CmpTODO,
        "tuple": fail,
        "variable": fail,
        "constant": fail,
        "not": fail,
        "ignore": fail
    },
    "constant": {
        "defer": CmpTODO,
        "tuple": fail,
        "variable": fail,
        "constant": function (p, i, q, j, ids) {
            return p.data[i].data === q.data[j].data;
        },
        "not": fail,
        "ignore": fail
    },
    "not": {
        "defer": CmpTODO,
        "tuple": CmpTODO,
        "variable": fail,
        "constant": fail,
        "not": function (p, i, q, j, ids) {
            return cmp(p, p.data[i].data, q, q.data[i].data, ids);
        },
        "ignore": fail
    },
    "ignore": {
        "defer": CmpTODO,
        "tuple": fail,
        "variable": fail,
        "constant": fail,
        "not": fail,
        "ignore": function () {return true;}
    }
};

function cmp (p, i, q, j, ids) {
    return (ids && (i === ids[j])) || (!ids && (i === j)) || cmpOp[p.data[i].type][q.data[j].type](p, i, q, j, ids);
}

module.exports = cmp;
