const ZVS = require("../../../zvs/zvs");
// const utils = require("./utils");
const prepare = require("./prepare");

// TODO: put unify into operators.
const actionUnify = require("../unify");

/*
    TODO: we should remove multiply on start, and add it to end: this means 
    to only multiply solutions.
        - The advantages are that we are avoiding weird/invalid/duplicated tuple
        generation, since we are not completing evaluating negations and 
        tuples in general.
        - Also less solutions lead to less values to multiply, and also 
        they can be optimized.
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

/*
    TODO:
        - we need first to add states, and refactor kanban promisse calls.
*/
function transitionMultiply (zvs, events) {
    return function ({queryBranchId, definitionsBranchId}) {
        return new Promise (function (resolve) {
            resolve({value: {queryBranchId, definitionsBranchId}});
        });
    };
}

module.exports = multiply;

