function tupleXtuple (p, q, b) {
    var po = b.get(p);
    var qo = b.get(q);

    var pData = b.get(po.data);
    var qData = b.get(qo.data);

    if (pData.length === qData.length) {
        for (var i=0; i<pData.length; i++) {
            // var r = b.change("unify", [pData[i], qData[i]]);
            if (!unify.call(b, pData[i], qData[i])) {
                return;                
            }
        }

        return true;
    }
    
}

function variableXall (p, q, b) {
    b.transform(p, q);
    return true;
}

function allXvariable (p, q, b) {
    return variableXall(q, p, b);
}

var table = {
    "tuple": {
        "tuple": tupleXtuple,
        "variable": allXvariable
    },
    "variable": {
        "tuple": variableXall,
        "variable": variableXall,
        "constant": variableXall
    },
    "constant": {
        "variable": allXvariable
    }
};

function unify (p, q) {
    p = this.getId(p);
    q = this.getId(q);

    if (p !== q) {
        var po = this.get(p);
        var qo = this.get(q);

        var pt = this.get(po.type);
        var qt = this.get(qo.type);

        if (table[pt] && table[pt][qt]) {
            return table[pt][qt](p, q, this);
        }
        
        return false;
    }

    return true;
}

function Unify (zvs) {
    return zvs.action("unify", unify);
}


module.exports = Unify;

