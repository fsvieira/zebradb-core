const prepare = require("./prepare");
const multiply = require("./multiply");

function branch (zvs, {parentBranchId, action, args}) {
    const parent = zvs.branches.getRawBranch(parentBranchId);
	
	return zvs.branches.getId({
	    parent: parentBranchId,
		args: args.slice(0),
		action: action,
		level: parent.data.level + 1
	});
}

function prepareDefinitions (req, res) {
    
    function genId () {
        return "id$" + req.store.id++;
    }
        
    const definitions = req.store.definitions;
    const tuple = req.args;
    
    if (tuple.type === 'query') {
        if (!req.store.definitionsBranchId) {
            const {zvs} = req.context;
            
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
        
        res.send({value: {tuple, definitionsBranchId: req.store.definitionsBranchId}});
    }
    else {
        const def = prepare.copyWithVars(tuple, genId);
        def.check = true;
                
        definitions.push(def);
        req.store.definitionsBranchId = undefined;
        res.send({});
    }
}

module.exports = prepareDefinitions;