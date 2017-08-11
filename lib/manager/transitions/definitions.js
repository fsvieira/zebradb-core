const graph = require("../../graph");
const prepare = require("../../prepare");

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
    
    var id = 0;
    function genId () {
        return "id$" + id++;
    }

    return function (tuple) {
        return new Promise (function (resolve) {
            if (tuple.type === 'query') {
                const query = prepare.copyWithVars(tuple.data, genId);
                const queryId = zvs.data.add(query);
                
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
                    
                    // events.trigger('branch', {branchId: definitionsBranchId});
                }

                const queryBranchId = branch(
                    zvs, 
                    {
                        parentBranchId: definitionsBranchId, 
                        action: 'query',
                        args: [queryId]
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
                // events.trigger('branch', {branchId: queryBranchId});
                
                resolve({value: queryBranchId, trackId: queryBranchId});
            }
            else {
                const def = prepare.copyWithVars(tuple, genId);
                def.check = true;
                
                definitions.push(def);
                definitionsBranchId = undefined;
                resolve({});
            }
        });
    };
}

module.exports = definitions;
