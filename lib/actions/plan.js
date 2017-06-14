const planner = require('../planner');

function plan (zvs) {
    return function (branchId) {
        return new Promise(function (resolve) {
            
            const queryId = zvs.getUpdatedId(branchId, zvs.data.global("query"));
            const nots = zvs.getData(branchId, zvs.getData(branchId, queryId).negation);
            
            resolve({
                value: {
                    branchId,
                    tuples: planner(zvs, branchId, queryId),
                    negations: nots && nots.length?nots:undefined
                }
            });
        });
    };
}

module.exports = plan;

