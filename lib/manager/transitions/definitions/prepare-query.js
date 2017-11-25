const prepare = require("./prepare");

function prepareQuery (req, res) {
    
    function genId () {
        return "id$" + req.store.id++;
    }
    
    const {query, definitionsBranchId} = req.args;
    const {zvs, events} = req.context;
    
    const preparedQuery = prepare.copyWithVars(query.data, genId);
    const queryId = zvs.data.add(preparedQuery);
        
    const {branchId: queryBranchId} = zvs.branches.getId({
	    parent: definitionsBranchId,
		args: [queryId],
		action: 'query',
		func: query.func
    });
    
    zvs.branches.transform(
        queryBranchId, 
        zvs.data.global("queryBranchId"),
        zvs.data.add({
            type: 'query',
            data: queryBranchId
        })
    );

    zvs.branches.transform(queryBranchId, zvs.data.global("query"), queryId);
        
    events.trigger('query-start', queryBranchId);

    res.send({value: {queryBranchId, definitionsBranchId: definitionsBranchId}, trackId: queryBranchId});
}

module.exports = prepareQuery;
