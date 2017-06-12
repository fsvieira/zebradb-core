/*
const prepare = require("../prepare");

function definitions (zvs, {branchId: parentBranchId, args: [defsHash]}) {
    const parent = zvs.branches.getRawBranch(parentBranchId);
	
	if (parent.metadata) {
	    Object.freeze(parent.metadata.changes);
	}
	
	const branchId = zvs.branches.branchHash({
	    parent: parentBranchId,
		args: [defsHash],
		action: "definitions",
		level: parent.data.level + 1
	});

    var defs = zvs.getData(branchId, defsHash);

    defs = prepare.uniq_fast(defs);

    var definitionsList = defs.map(function (d) {
        return zvs.getObject(branchId, d);
    });


    zvs.update(branchId, zvs.data.global("definitions"), {definitions: definitionsList});
    
    return branchId;
}

module.exports = definitions;
*/

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

function definitions (zvs) {
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

                    zvs.branches.transform(definitionsBranchId, zvs.data.global("definitions"), {
                        type: 'definitions',
                        data: {
                            definitions: defs,
                            branchId: definitionsBranchId
                        }
                    });
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

                zvs.branches.transform(queryBranchId, zvs.data.global("queryBranchId"), {
                    type: 'query',
                    data: queryBranchId
                });

                zvs.branches.transform(queryBranchId, zvs.data.global("query"), queryId);
                
                resolve({value: queryBranchId});
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
