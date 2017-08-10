// const negation = require("./negation");
const prepare = require("./prepare");

// const utils = require("./utils");

function tupleXtuple (zvs, branchId, p, q, evalNegation, noUpdate) {
    var po = zvs.getData(branchId, p);
    var qo = zvs.getData(branchId, q);

    var pData = zvs.getData(branchId, po.data);
    var qData = zvs.getData(branchId, qo.data);

    if (pData.length === qData.length) {
        for (var i=0; i<pData.length; i++) {
            if (!unify(zvs, branchId, pData[i], qData[i], evalNegation, noUpdate)) {
                return;                
            }
        }

        return true;
    }
    
}

function variableXall (zvs, branchId, p, q, evalNegation, noUpdate) {
    zvs.branches.transform(branchId, p, q);
    return true;
}

function allXvariable (zvs, branchId, p, q, evalNegation, noUpdate) {
    zvs.branches.transform(branchId, q, p);
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


function update (zvs, branchId, p, q) {
    var po = zvs.getData(branchId, p);
    var qo = zvs.getData(branchId, q);

    var updateData = {
        check: zvs.getData(branchId, po.check) || zvs.getData(branchId, qo.check),
        loop: zvs.getData(branchId, po.loop) || zvs.getData(branchId, qo.loop)
    };

    var doUpdate = updateData.check || updateData.loop;
    var ns = prepare.union(zvs, branchId, zvs.getData(branchId, po.negation) || [], zvs.getData(branchId, qo.negation) || []);

    if (ns && ns.length > 0) {
        updateData.negation = ns;
        doUpdate = true;
    }
    
    // setting virtual,
    if (po.virtual !== qo.virtual) {
        doUpdate = true;    
    
        if (po.virtual && qo.virtual) {
            // need to merge
            var virtualA = zvs.getObject(branchId, po.virtual);
            var virtualB = zvs.getObject(branchId, qo.virtual);
            
            updateData.virtual = {
                score: (virtualA.score + virtualB.score) / 2,
                vscore: (virtualA.vscore + virtualB.vscore) / 2,
                transitions: virtualA.transitions.filter(function (t) {
                   return virtualB.transitions.indexOf(t) !== -1;
                })
            };
            
            if (updateData.virtual.transitions.length === 0) {
                // zvs.branches.end(branchId, true, "No transitions!!");
                return false;
            }
            
        }
        else {
            updateData.virtual = zvs.getObject(branchId, po.virtual || qo.virtual);
        }
    }

    if (doUpdate) {
        zvs.update(branchId, p, updateData);
        zvs.update(branchId, q, updateData);
    }
    
    return true;
}

function unify (zvs, branchId, p, q, evalNegation, noUpdate) {
    p = zvs.branches.getDataId(branchId, p);
    q = zvs.branches.getDataId(branchId, q);

    var po = zvs.getData(branchId, p);
    var qo = zvs.getData(branchId, q);
    var r = true;

    if (p !== q) {
        var pt = zvs.getData(branchId, po.type);
        var qt = zvs.getData(branchId, qo.type);

        if (table[pt] && table[pt][qt]) {
            r = table[pt][qt](zvs, branchId, p, q, evalNegation, noUpdate);
        }
        else {
            r = false;
        }
    }

    if (!r) {
        // zvs.branches.end(branchId, true, "unify fail!");
        return;
    }

    if (!noUpdate && !update(zvs, branchId, p, q)) {
        return;
    }

    /*if (evalNegation && !negation(zvs, branchId)) {
        return;
    }*/

    return branchId;
}

module.exports = unify;
