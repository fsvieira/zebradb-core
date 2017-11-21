const Match = require("../../match/match");

function checkDefinition (zvs, branchId, tupleId, match) {
    const tuples = [tupleId];
    const done = [tupleId];
    
    while (tuples.length) {
        const tupleId = tuples.pop();
        
        const m = match.match(branchId, tupleId);
        
        if (!m && m.length) {
            return false;
        }
        
        const data = zvs.getData(branchId, tupleId).data;
        
        for (let i=0; i<data.length; i++) {
            const id = data[i];
            const v = zvs.getData(branchId, id);
            const type = zvs.getData(branchId, v.type);
            
            if (type === 'tuple') {
                if (done.indexOf(id) === -1) {
                    done.push(id);
                    tuples.push(id);
                }
            }
        }
    }
    
    return true;
}

/*
    TODO:
        * Run similiar check that is on select phase,
        
        * Problems with this check:
            - inner tuples and definitions intersection may be empty,
            - removing a definition may make other definitions invalid.
*/

function checkMultiply (zvs, events) {
    return function ({queryBranchId, definitionsBranchId}) {
        return new Promise (function (resolve) {
            const definitions = zvs.getData(queryBranchId,
                zvs.getData(
                        queryBranchId, zvs.getData(
                            queryBranchId, zvs.data.global("definitions")
                        ).data
                ).definitions
            );

            
            const match = new Match(zvs);
            match.addTuples(definitions);
            
            for (let i=definitions.length-1; i>=0; i--) {
                if (!checkDefinition(zvs, queryBranchId, definitions[i], match)) {
                    console.log("Invalid definition after multiply, it will be removed ...");
                    definitions.splice(i, 1);
                }
            }

            zvs.addDefinitionsMatch(definitionsBranchId, match);

            resolve({value: queryBranchId});
        });
    };
}

module.exports = checkMultiply;