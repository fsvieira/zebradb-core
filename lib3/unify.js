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

function uniq_fast(a) {
    var seen = {};
    var out = [];
    var len = a.length;
    var j = 0;
    for(var i = 0; i < len; i++) {
         var item = a[i];
         if(seen[item] !== 1) {
               seen[item] = 1;
               out[j++] = item;
         }
    }
    return out;
}

function unify (p, q) {
    p = this.getId(p);
    q = this.getId(q);

    var po = this.get(p);
    var qo = this.get(q);

    var r = true;
    if (p !== q) {
        var pt = this.get(po.type);
        var qt = this.get(qo.type);

        if (table[pt] && table[pt][qt]) {
            r = table[pt][qt](p, q, this);
        }
        else {
            return false;
        }
    }

    var check = this.get(po.check) || this.get(qo.check);
    var negation = uniq_fast((this.get(po.negation) || []).concat(this.get(qo.negation) || []));

    if (negation.length) {
        this.update(p, {negation: negation, check: check});
        this.update(q, {negation: negation, check: check});
    }
    else if (check) {
        this.update(p, {check: check});
        this.update(q, {check: check});
    }

    if (!r) {
        this.notes({status: {fail: true, reason: "unify fail!"}});
    }

    return r;
}

function Unify (zvs) {
    return zvs.action("unify", unify);
}


module.exports = Unify;

