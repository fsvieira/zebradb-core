const planner = require('../../planner');

function plan (zvs) {
    return function (branchId) {
        return new Promise(function (resolve) {
            
            const settings = zvs.getObject(branchId, zvs.data.global("settings"));
            
            if (settings && settings.data && settings.data.depth !== undefined) {
                const branch = zvs.branches.getRawBranch(branchId);
                if (branch.data.level > settings.data.depth) {
                    zvs.branches.end({branchId, fail: true, reason: "max depth reached"});
                    resolve({});
                    return;
                }
            }
            
            const queryId = zvs.getUpdatedId(branchId, zvs.data.global("query"));
            var nots = zvs.getData(branchId, zvs.getData(branchId, queryId).negation);
                
            if (nots) {
                nots = nots.filter(function (n) {
                    return !zvs.getData(branchId, n).exists;
                });
            }
    
            if (!nots || !nots.length) {
                nots = undefined;
            }
                
            resolve({
                value: {
                    branchId,
                    tuples: planner(zvs, branchId, queryId),
                    negations: nots
                }
            });
        });
    };
}

module.exports = plan;

