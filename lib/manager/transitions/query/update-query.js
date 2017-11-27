function updateQuery (req, res) {
    const branchId = req.args;
    const {zvs} = req.context;

    const queryId = zvs.getUpdatedId(branchId, zvs.data.global("query"));
            
    if (!queryId) {
        res.send({});
        return;
    }
    
    res.send({value: {branchId, queryId}});
}

module.exports = updateQuery;
