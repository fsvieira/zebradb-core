const planner = require('../planner');

function plan (zvs) {
    return function (branchId) {
        return new Promise(function (resolve) {
            
            // TODO: 
            //      * on planner get absolute Id,
            //          - since we are going to get all tuples, we should also update queryId,
            resolve({
                value: {
                    branchId,
                    tuples: planner(zvs, branchId, zvs.data.global("query"))
                }
            });
        });
    };
}

module.exports = plan;

