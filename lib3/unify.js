var utils = require("./utils");
var negation = require("./negation");
var prepare = require("./prepare");

function tupleXtuple (p, q, b, evalNegation) {
    var po = b.get(p);
    var qo = b.get(q);

    var pData = b.get(po.data);
    var qData = b.get(qo.data);

    if (pData.length === qData.length) {
        for (var i=0; i<pData.length; i++) {
            // var r = b.change("unify", [pData[i], qData[i]]);
            if (!unify(pData[i], qData[i], b, evalNegation)) {
                return;                
            }
        }

        return true;
    }
    
}

function variableXall (p, q, b, evalNegation) {
    b.transform(p, q);
    return true;
}

function allXvariable (p, q, b, evalNegation) {
    b.transform(q, p);
    return true;
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

/*
function unify (p, q) {
    p = this.getId(p);
    q = this.getId(q);

    var s = "UNIFY: " + utils.toString(this.getObject(p), true) + ", " + utils.toString(this.getObject(q), true);

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
            r = false;
        }
    }

    console.log(
        s + " => " +
        utils.toString(this.getObject(p), true) + ", " + utils.toString(this.getObject(q), true)
    );

    if (!r) {
        this.notes({status: {fail: true, reason: "unify fail!"}});
        return r;
    }

    var check = this.get(po.check) || this.get(qo.check);
    var negations = prepare.union(this, this.get(po.negation), this.get(qo.negation));

    if (negations.length) {
        this.update(p, {negation: negations, check: check});
        this.update(q, {negation: negations, check: check});
    }
    else if (check) {
        this.update(p, {check: check});
        this.update(q, {check: check});
    }

    if (!negation(this)) {
        return false;
    }

    return true;
}

// TODO: this does't make sense:
function Unify (zvs) {
    return zvs.action("unify", unify);
}


module.exports = Unify;
*/

function unify (p, q, b, evalNegation) {
    p = b.getId(p);
    q = b.getId(q);

    var po = b.get(p);
    var qo = b.get(q);
    var r = true;
    
    if (p !== q) {
        var pt = b.get(po.type);
        var qt = b.get(qo.type);

        if (table[pt] && table[pt][qt]) {
            r = table[pt][qt](p, q, b, evalNegation);
        }
        else {
            r = false;
        }
    }

    if (!r) {
        b.notes({status: {fail: true, reason: "unify fail!"}});
        return r;
    }

    var check = b.get(po.check) || b.get(qo.check);
    var negations = prepare.union(b, b.get(po.negation), b.get(qo.negation));

    if (negations.length) {
        b.update(p, {negation: negations, check: check});
        b.update(q, {negation: negations, check: check});
    }
    else if (check) {
        b.update(p, {check: check});
        b.update(q, {check: check});
    }

    if (evalNegation && !negation(b)) {
        return false;
    }

    return true;
}


module.exports = unify;
