const prepare = require("./prepare");


function negation (b) {
    var definitionsHash = b.zvs.getData(b.id, b.zvs.data.global("definitions")).definitions;
    var q = b.zvs.data.global("query");
    
    var nots = b.zvs.getData(b.id, b.zvs.getData(b.id, q).negation);
    
    if (nots && nots.length > 0) {
        var tuples = [q];
        var code;
        
        var variables = [];
    
        // get all query variables,
        while (tuples.length > 0) {
            code = b.zvs.branches.getDataId(b.id, tuples.pop());
            var v = b.zvs.getData(b.id, code);
            var type = b.zvs.getData(b.id, v.type);
            
            if (type === 'variable') {
                if (variables.indexOf(code) === -1) {
                    variables.push(code);
                }
            }
            else if (type === 'tuple') {
                var data = b.zvs.getData(b.id, v.data);
                tuples = tuples.concat(data);
            }
        }
        
        // find nots that can be executed,
        for (var i=nots.length-1; i >= 0; i--) {
            tuples = [nots[i]];
            var execute = true;
            
            while (tuples.length > 0) {
                code = b.zvs.branches.getDataId(b.id, tuples.pop());
                v = b.zvs.getData(b.id, code);
                
                if (v.exists !== undefined) {
                    execute = false;
                    break;
                }
                
                type = b.zvs.getData(b.id, v.type);
                
                if (type === 'variable') {
                    
                    if (variables.indexOf(code) !== -1) {
                        execute = false;
                        break;
                    }
                }
                else if (type === 'tuple') {
                    data = b.zvs.getData(b.id, v.data);
                    tuples = tuples.concat(data);
                }
            }
            
            if (execute) {
                var neg = b.zvs.getObject(b.id, nots[i]);
                
                var nQuery = b.zvs.data.add(
                    prepare.query(neg)
                );
                
                var branch = b.zvs.change(
                    b.zvs.branches.root,
                    "definitions", [
                        definitionsHash
                    ]
                );
                
                var results = b.zvs.change(branch, "query", [nQuery]);
    
                if (results && results.length > 0) {
                    b.zvs.branches.notes(b.id, {status: {fail: true, reason: "negation fail!"}});
                    return false;                
                }
                else {
                    b.zvs.update(b.id, nots[i], {exists: false});
                }
            }
        }
    }
    
    return true;
}

module.exports = negation;

