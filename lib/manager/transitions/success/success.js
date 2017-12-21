function success (req, res) {
    const {branchId} = req.args;
    const {zvs, events} = req.context;
    const queryBranchId = zvs.getObject(branchId, zvs.data.global("queryBranchId")).data;

    zvs.branches.end({
        rootBranchId: queryBranchId,
        branchId, 
        success: true
    });

    events.trigger("success", branchId);
    res.send({});
}

module.exports = success;
