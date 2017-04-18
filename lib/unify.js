var negation = require("./negation");
var utils = require("./utils");
var prepare = require("./prepare");

function tupleXtuple (p, q, b, evalNegation, noUpdate) {
    var po = b.get(p);
    var qo = b.get(q);

    var pData = b.get(po.data);
    var qData = b.get(qo.data);

    if (pData.length === qData.length) {
        for (var i=0; i<pData.length; i++) {
            if (!unify(pData[i], qData[i], b, evalNegation, noUpdate)) {
                return;                
            }
        }

        return true;
    }
    
}

function variableXall (p, q, b, evalNegation, noUpdate) {
    b.transform(p, q);
    return true;
}

function allXvariable (p, q, b, evalNegation, noUpdate) {
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


function update (b, p, q) {
    var po = b.get(p);
    var qo = b.get(q);

    var updateData = {
        check: b.get(po.check) || b.get(qo.check),
        loop: b.get(po.loop) || b.get(qo.loop)
    };

    var doUpdate = updateData.check || updateData.loop;
    var ns = prepare.union(b, b.get(po.negation) || [], b.get(qo.negation) || []);

    if (ns && ns.length > 0) {
        updateData.negation = ns;
        doUpdate = true;
    }
    
    // setting virtual,
    if (po.virtual !== qo.virtual) {
        doUpdate = true;    
    
        if (po.virtual && qo.virtual) {
            // need to merge
            var virtualA = b.getObject(po.virtual);
            var virtualB = b.getObject(qo.virtual);
            
            updateData.virtual = {
                score: (virtualA.score + virtualB.score) / 2,
                vscore: (virtualA.vscore + virtualB.vscore) / 2,
                transitions: virtualA.transitions.filter(function (t) {
                   return virtualB.transitions.indexOf(t) !== -1;
                })
            };
            
            if (updateData.virtual.transitions.length === 0) {
                b.notes({status: {fail: true, reason: "No transitions!!"}});
                return false;
            }
            
        }
        else {
            updateData.virtual = b.getObject(po.virtual || qo.virtual);
        }
    }

    if (doUpdate) {
        b.update(p, updateData);
        b.update(q, updateData);
    }
    
    return true;
}

function unify (p, q, b, evalNegation, noUpdate) {
    p = b.getId(p);
    q = b.getId(q);

    var po = b.get(p);
    var qo = b.get(q);
    var r = true;

    if (p !== q) {
        var pt = b.get(po.type);
        var qt = b.get(qo.type);

        if (table[pt] && table[pt][qt]) {
            r = table[pt][qt](p, q, b, evalNegation, noUpdate);
        }
        else {
            r = false;
        }
    }

    if (!r) {
        b.notes({status: {fail: true, reason: "unify fail!"}});
        return r;
    }

    if (!noUpdate && !update(b, p, q)) {
        return false;
    }

    if (evalNegation && !negation(b)) {
        return false;
    }
    

    return true;
}

module.exports = unify;
