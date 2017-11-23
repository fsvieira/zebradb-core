const prepare = require("./prepare");

function branch (zvs, {parentBranchId, action, args, func}) {
    const parent = zvs.branches.getRawBranch(parentBranchId);
	
	return zvs.branches.getId({
	    parent: parentBranchId,
		args: args.slice(0),
		action: action,
		level: parent.data.level + 1,
		func
	});
}

function prepareQuery (req, res) {
    
    function genId () {
        return "id$" + req.store.id++;
    }
    
    const {tuple, definitionsBranchId} = req.args;
    const {zvs, events} = req.context;
    
    const query = prepare.copyWithVars(tuple.data, genId);
    const queryId = zvs.data.add(query);
        
    const {branchId: queryBranchId} = branch(
        zvs,
        {
            parentBranchId: definitionsBranchId, 
            action: 'query',
            args: [queryId],
            func: tuple.func
        }
    );

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
