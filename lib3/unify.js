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

function setNegation (p, q, po, qo, b) {
    var negations = (b.get(po.negation) || []).concat(b.get(qo.negation) || []);

    if (negations.length > 0) {
        var globalsHash = b.global("globals");
        if (globalsHash) {
            var globals = b.get(globalsHash);
            var query = globals.query;
            
            var queryNegation = prepare.union(b, b.get(b.get(query).negation) || [], negations);
    
    
            b.update(p, {negation: undefined});
            b.update(q, {negation: undefined});
    
            b.update(query, {negation: queryNegation});
        }
    }
}


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
    var loop = b.get(po.loop) || b.get(qo.loop);

    if (check) {
        b.update(p, {check: check, loop: false});
        b.update(q, {check: check, loop: false});
    }
    else if (loop) {
        b.update(p, {loop: loop});
        b.update(q, {loop: loop});
    }

    setNegation(p, q, po, qo, b);

    if (evalNegation && !negation(b)) {
        return false;
    }

    return true;
}


module.exports = unify;
