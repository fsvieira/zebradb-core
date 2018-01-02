"use strict";

const prepare = require("../definitions/prepare");

function tupleXtuple (zvs, branchId, p, q) {
    let po = zvs.getData(branchId, p);
    let qo = zvs.getData(branchId, q);

    let pData = zvs.getData(branchId, po.data);
    let qData = zvs.getData(branchId, qo.data);

    if (pData.length === qData.length) {
        for (let i=0; i<pData.length; i++) {
            if (!unify(zvs, branchId, pData[i], qData[i])) {
                return;
            }
        }

        return true;
    }

}

function variableXall (zvs, branchId, p, q) {
    zvs.branches.transform(branchId, p, q);
    return true;
}

function allXvariable (zvs, branchId, p, q) {
    zvs.branches.transform(branchId, q, p);
    return true;
}

const table = {
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
    let po = zvs.getData(branchId, p);
    let qo = zvs.getData(branchId, q);

    let updateData = {
        check: zvs.getData(branchId, po.check) ||
        	zvs.getData(branchId, qo.check)
    };

    let doUpdate = updateData.check;
    let ns = prepare.union(
        zvs,
        branchId,
        zvs.getData(branchId, po.negation) || [],
        zvs.getData(branchId, qo.negation) || []
    );

    if (ns && ns.length > 0) {
        updateData.negation = ns;
        doUpdate = true;
    }

    if (doUpdate) {
        zvs.update(branchId, p, updateData);
        zvs.update(branchId, q, updateData);
    }

    return true;
}

function unify (zvs, branchId, p, q, evalNegation) {
    p = zvs.branches.getDataId(branchId, p);
    q = zvs.branches.getDataId(branchId, q);

    let po = zvs.getData(branchId, p);
    let qo = zvs.getData(branchId, q);
    let r = true;

    if (p !== q) {
        let pt = zvs.getData(branchId, po.type);
        let qt = zvs.getData(branchId, qo.type);

        if (table[pt] && table[pt][qt]) {
            r = table[pt][qt](zvs, branchId, p, q, evalNegation);
        }
        else {
            r = false;
        }
    }

    if (!r) {
        // zvs.branches.end(branchId, true, "unify fail!");
        return;
    }

    if (!update(zvs, branchId, p, q)) {
        return;
    }

    return branchId;
}

module.exports = unify;
