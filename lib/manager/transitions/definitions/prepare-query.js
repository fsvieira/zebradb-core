const prepare = require("./prepare");

function branch (zvs, {parentBranchId, action, args}) {
    const parent = zvs.branches.getRawBranch(parentBranchId);
	
	return zvs.branches.getId({
	    parent: parentBranchId,
		args: args.slice(0),
		action: action,
		level: parent.data.level + 1
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
        
    const {branchId: queryBranchId, exists} = branch(
        zvs, 
        {
            parentBranchId: definitionsBranchId, 
            action: 'query',
            args: [queryId]
        }
    );

    var functions;
        
    if (exists && tuple.func) {
        const f = zvs.getObject(queryBranchId, zvs.data.global("queryFunctions"));
            
        if (f.data.indexOf(tuple.func) === -1) {
            functions = f.data;
            functions.push(tuple.func);
        }
    }
    else {
        functions = [];
            
        if (tuple.func) {
            functions.push(tuple.func);
        }
    }

    if (functions) {
        zvs.branches.transform(
            queryBranchId,
            zvs.data.global("queryFunctions"),
            zvs.data.add({
                type: 'functions',
                data: functions
            })
        );
    }
        
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
