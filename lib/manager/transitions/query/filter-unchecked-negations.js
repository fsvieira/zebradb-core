function filterUncheckedNegations (req, res) {
    const {branchId, queryId} = req.args;
    const {zvs} = req.context;
    
    var nots = zvs.getData(branchId, zvs.getData(branchId, queryId).negation);
                
    if (nots) {
        nots = nots.filter(function (n) {
            return zvs.getData(zvs.getData(branchId, n).exists) === undefined;
        });
    }
    
    if (nots && nots.length) {
        res.send({value: {branchId, queryId, negations: nots}});
    }
    else {
        res.send({value: {branchId, queryId}});
    }
}

module.exports = filterUncheckedNegations;

