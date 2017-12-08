const utils = require("../../../utils");

function updateQuery (req, res) {
    const branchId = req.args;
    const {zvs} = req.context;
/*
    const queryId = zvs.getUpdatedId(branchId, zvs.data.global("query"));
            
    if (!queryId) {
        res.send({});
        return;
    }
*/    
    const queryId = zvs.branches.getDataId(branchId, zvs.data.global("query"));
    
    // utils.printQuery(zvs, branchId, "Query");
    
    res.send({value: {branchId, queryId}});
}

module.exports = updateQuery;
