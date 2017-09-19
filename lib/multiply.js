const ZVS = require("./zvs/zvs");
// const utils = require("./utils");
const prepare = require("./prepare");

// TODO: put unify into operators.
const actionUnify = require("./manager/transitions/unify");

/*
    TODO: make sure we are handling negation on multiply.
*/

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
                    if (results.indexOf(id) === -1) {
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
    
    const r = _multiply(zvs, definitions.map(d => zvs.data.add(d)));
    
    const results = r.map(d => zvs.getObject(zvs.branches.root, d));

    return prepare.definitions(results);
}

module.exports = multiply;

