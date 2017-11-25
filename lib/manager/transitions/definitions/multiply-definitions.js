const ZVS = require("../../../zvs/zvs");
const prepare = require("./prepare");
const actionUnify = require("../unify");

function _multiply (zvs, definitions) {
    if (definitions.length > 1) {
        const results = [definitions.shift()];

        for (var i=0; i<definitions.length; i++) {
            // d * r
            const d = definitions[i];
            
            for (var j=0; j<results.length; j++) {
                const r = results[j];
                const result = actionUnify(zvs, {branchId: zvs.branches.root, args: [d, r]});
                
                if (result !== undefined) {
                    const id = zvs.getUpdatedId(result, d);

                    if (id !== undefined && results.indexOf(id) === -1) {
                        results.push(id);
                    }
                }
            }
        }
        
        const r = _multiply(zvs, definitions);
        
        r.forEach(d => {
            if (results.indexOf(d) === -1) {
                results.push(d);
            }
        });
        
        return results;
    }

    return definitions; 
}

function multiply(definitions) {
    const zvs = new ZVS();
    
    definitions = prepare.definitions(definitions);
    
    const r = _multiply(zvs, definitions.map(d => zvs.data.add(d)));
    const results = r.map(d => zvs.getObject(zvs.branches.root, d));

    return prepare.definitions(results);
}

function multiplyDefinitions (req, res) {
    const {definitions, query} = req.args;
    
    const {zvs} = req.context;
            
    // TODO: make sure that definitions don't change, and copy is made.
    const defs = multiply(definitions);
    const definitionsId = zvs.data.add(defs);
                
    const definitionsBranchId = zvs.branches.getId({
	    parent: zvs.branches.root,
		args: [definitionsId],
		action: 'definitions'
    }).branchId;
            
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

    res.send({value: {query, definitionsBranchId}});
}

module.exports = multiplyDefinitions;

