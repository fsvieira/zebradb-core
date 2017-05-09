var negation = require("./negation");
var utils = require("./utils");
var prepare = require("./prepare");

function tupleXtuple (p, q, b, evalNegation, noUpdate) {
    var po = b.zvs.getData(b.id, p);
    var qo = b.zvs.getData(b.id, q);

    var pData = b.zvs.getData(b.id, po.data);
    var qData = b.zvs.getData(b.id, qo.data);

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
    b.zvs.branches.transform(b.id, p, q);
    return true;
}

function allXvariable (p, q, b, evalNegation, noUpdate) {
    b.zvs.branches.transform(b.id, q, p);
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
    var po = b.zvs.getData(b.id, p);
    var qo = b.zvs.getData(b.id, q);

    var updateData = {
        check: b.zvs.getData(b.id, po.check) || b.zvs.getData(b.id, qo.check),
        loop: b.zvs.getData(b.id, po.loop) || b.zvs.getData(b.id, qo.loop)
    };

    var doUpdate = updateData.check || updateData.loop;
    var ns = prepare.union(b, b.zvs.getData(b.id, po.negation) || [], b.zvs.getData(b.id, qo.negation) || []);

    if (ns && ns.length > 0) {
        updateData.negation = ns;
        doUpdate = true;
    }
    
    // setting virtual,
    if (po.virtual !== qo.virtual) {
        doUpdate = true;    
    
        if (po.virtual && qo.virtual) {
            // need to merge
            var virtualA = b.zvs.getObject(b.id, po.virtual);
            var virtualB = b.zvs.getObject(b.id, qo.virtual);
            
            updateData.virtual = {
                score: (virtualA.score + virtualB.score) / 2,
                vscore: (virtualA.vscore + virtualB.vscore) / 2,
                transitions: virtualA.transitions.filter(function (t) {
                   return virtualB.transitions.indexOf(t) !== -1;
                })
            };
            
            if (updateData.virtual.transitions.length === 0) {
                b.zvs.branches.notes(b.id, {status: {fail: true, reason: "No transitions!!"}});
                return false;
            }
            
        }
        else {
            updateData.virtual = b.zvs.getObject(b.id, po.virtual || qo.virtual);
        }
    }

    if (doUpdate) {
        b.zvs.update(b.id, p, updateData);
        b.zvs.update(b.id, q, updateData);
    }
    
    return true;
}

function unify (p, q, b, evalNegation, noUpdate) {
    p = b.zvs.branches.getDataId(b.id, p);
    q = b.zvs.branches.getDataId(b.id, q);

    var po = b.zvs.getData(b.id, p);
    var qo = b.zvs.getData(b.id, q);
    var r = true;

    if (p !== q) {
        var pt = b.zvs.getData(b.id, po.type);
        var qt = b.zvs.getData(b.id, qo.type);

        if (table[pt] && table[pt][qt]) {
            r = table[pt][qt](p, q, b, evalNegation, noUpdate);
        }
        else {
            r = false;
        }
    }

    if (!r) {
        b.zvs.branches.notes(b.id, {status: {fail: true, reason: "unify fail!"}});
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
