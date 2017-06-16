const graph = require("../graph");

function branch (zvs, {parentBranchId, action, args}) {
    const parent = zvs.branches.getRawBranch(parentBranchId);
	
	if (parent.metadata) {
	    Object.freeze(parent.metadata.changes);
	}
	
	return zvs.branches.branchHash({
	    parent: parentBranchId,
		args: args.slice(0),
		action: action,
		level: parent.data.level + 1
	});
}

function definitions (zvs, events) {
    const definitions = [];
    var definitionsBranchId;
    
    return function (tuple) {
        return new Promise (function (resolve) {
            if (tuple.type === 'query') {
                if (!definitionsBranchId) {
                    // TODO: keep this in a list,
                    const defs = graph(definitions).definitions;
                    const definitionsId = zvs.data.add(defs);
                    
                    definitionsBranchId = branch(
                        zvs, 
                        {
                            parentBranchId: zvs.branches.root, 
                            action: 'definitions', 
                            args: [definitionsId]
                        }
                    );

                    zvs.branches.transform(
                        definitionsBranchId, 
                        zvs.data.global("definitions"), 
                        zvs.data.add({
                            type: 'definitions',
                            data: {
                                definitions: defs,
                                branchId: definitionsBranchId
                            }
                        })
                    );
                }
                
                const queryId = tuple.zid;
                const queryBranchId = branch(
                    zvs, 
                    {
                        parentBranchId: definitionsBranchId, 
                        action: 'query',
                        args: [tuple.zid]
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
                resolve({value: queryBranchId, trackId: queryBranchId});
            }
            else {
                definitions.push(tuple);
                definitionsBranchId = undefined;
                resolve({});
            }
        });
    };
}

module.exports = definitions;
