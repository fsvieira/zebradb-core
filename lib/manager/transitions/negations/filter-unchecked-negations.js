"use strict";

function filterUncheckedNegations (req, res) {
    let {branches, branchId} = req.args;
    const {zvs} = req.context;

    branches = branches || [[branchId]];

    const results = {
        branches,
        negations: [],
        branchId
    };

    const queryId = zvs.data.global("query");

    for (let i=0; i<branches.length; i++) {
        const bs = branches[i];

        for (let j=0; j<bs.length; j++) {
            const branchId = bs[j];

            let nots = zvs.getData(
            	branchId,
            	zvs.getData(branchId, queryId).negation
            );

            if (nots) {
                nots = nots.filter(
                	n => zvs.getData(
                		branchId,
                		zvs.getData(branchId, n).exists
                	) === undefined
                );
            }

            if (nots && nots.length) {
                results.negations.push({
                	branchId,
                	negations: nots,
                	branches: bs
                });
            }
        }
    }

    res.send({value: results});
}

module.exports = filterUncheckedNegations;

