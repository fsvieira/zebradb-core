const prepare = require("./prepare");


function negation (zvs, branchId) {
    var definitionsHash = zvs.getData(branchId, zvs.data.global("definitions")).definitions;
    var q = zvs.data.global("query");
    
    var nots = zvs.getData(branchId, zvs.getData(branchId, q).negation);
    
    if (nots && nots.length > 0) {
        var tuples = [q];
        var code;
        
        var variables = [];
    
        // get all query variables,
        while (tuples.length > 0) {
            code = zvs.branches.getDataId(branchId, tuples.pop());
            var v = zvs.getData(branchId, code);
            var type = zvs.getData(branchId, v.type);
            
            if (type === 'variable') {
                if (variables.indexOf(code) === -1) {
                    variables.push(code);
                }
            }
            else if (type === 'tuple') {
                var data = zvs.getData(branchId, v.data);
                tuples = tuples.concat(data);
            }
        }
        
        // find nots that can be executed,
        for (var i=nots.length-1; i >= 0; i--) {
            tuples = [nots[i]];
            var execute = true;
            
            while (tuples.length > 0) {
                code = zvs.branches.getDataId(branchId, tuples.pop());
                v = zvs.getData(branchId, code);
                
                if (v.exists !== undefined) {
                    execute = false;
                    break;
                }
                
                type = zvs.getData(branchId, v.type);
                
                if (type === 'variable') {
                    
                    if (variables.indexOf(code) !== -1) {
                        execute = false;
                        break;
                    }
                }
                else if (type === 'tuple') {
                    data = zvs.getData(branchId, v.data);
                    tuples = tuples.concat(data);
                }
            }
            
            if (execute) {
                var neg = zvs.getObject(branchId, nots[i]);
                
                var nQuery = zvs.data.add(
                    prepare.query(neg)
                );
                
                var definitionsBranchId = zvs.change(
                    zvs.branches.root,
                    "definitions", [
                        definitionsHash
                    ]
                );
                
                var results = zvs.change(definitionsBranchId, "query", [nQuery]);
    
                if (results && results.length > 0) {
                    zvs.branches.notes(branchId, {status: {fail: true, reason: "negation fail!"}});
                    return false;                
                }
                else {
                    zvs.update(branchId, nots[i], {exists: false});
                }
            }
        }
    }
    
    return true;
}

module.exports = negation;

