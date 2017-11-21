const planner = require('../../planner/planner');

function plan (req, res) {
    const branchId = req.args;
    const {zvs, events} = req.context;

    const settings = zvs.getObject(branchId, zvs.data.global("settings"));
            
    if (settings && settings.data && settings.data.depth !== undefined) {
        const branch = zvs.branches.getRawBranch(branchId);
        if (branch.data.level > settings.data.depth) {
            zvs.branches.end({branchId, fail: true, reason: "max depth reached"});
            res.send({});
            return;
        }
    }
            
    const queryId = zvs.getUpdatedId(branchId, zvs.data.global("query"));
            
    if (!queryId) {
        res.send({});
        return;
    }
            
    var nots = zvs.getData(branchId, zvs.getData(branchId, queryId).negation);
                
    if (nots) {
        nots = nots.filter(function (n) {
            return !zvs.getData(branchId, n).exists;
        });
    }
    
    if (!nots || !nots.length) {
        nots = undefined;
    }
            
    const tuples = planner(zvs, branchId, queryId);
            
    if (tuples) {
        res.send({
            value: {
                branchId,
                tuples,
                negations: nots
            }
        });
    }
    else {
        res.send({});
    }
}

module.exports = plan;

