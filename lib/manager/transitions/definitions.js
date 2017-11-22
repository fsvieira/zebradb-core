const prepare = require("./definitions/prepare");
const multiply = require("./definitions/multiply");

function branch (zvs, {parentBranchId, action, args}) {
    const parent = zvs.branches.getRawBranch(parentBranchId);
	
	return zvs.branches.getId({
	    parent: parentBranchId,
		args: args.slice(0),
		action: action,
		level: parent.data.level + 1
	});
}

function definitions (req, res) {
    
    const definitions = req.store.definitions;
    
    function genId () {
        return "id$" + req.store.id++;
    }

    const tuple = req.args;
    const {zvs, events} = req.context;
    
    if (tuple.type === 'query') {
        const query = prepare.copyWithVars(tuple.data, genId);
        const queryId = zvs.data.add(query);
            
        if (!req.store.definitionsBranchId) {
            // TODO: make sure that definitions don't change, and copy is made.
            const defs = multiply(definitions);
            const definitionsId = zvs.data.add(defs);
                
            req.store.definitionsBranchId = branch(
                zvs,
                {
                    parentBranchId: zvs.branches.root, 
                    action: 'definitions', 
                    args: [definitionsId]
                }
            ).branchId;

            zvs.branches.transform(
                req.store.definitionsBranchId, 
                zvs.data.global("definitions"), 
                zvs.data.add({
                    type: 'definitions',
                    data: {
                        definitions: defs,
                        branchId: req.store.definitionsBranchId
                    }
                })
            );
        }

        const {branchId: queryBranchId, exists} = branch(
            zvs, 
            {
                parentBranchId: req.store.definitionsBranchId, 
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

        res.send({value: {queryBranchId, definitionsBranchId: req.store.definitionsBranchId}, trackId: queryBranchId});
    }
    else {
        const def = prepare.copyWithVars(tuple, genId);
        def.check = true;
            
        definitions.push(def);
        req.store.definitionsBranchId = undefined;
        res.send({});
    }
}

module.exports = definitions;
