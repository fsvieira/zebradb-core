var prepare = require("./prepare");

function negation (b) {
    var definitionsHash = b.get(b.global("definitions")).definitions;
    var q = b.global("query");
    
    var nots = b.get(b.get(q).negation);
    
    if (nots && nots.length > 0) {
        var tuples = [q];
        var code;
        
        var variables = [];
    
        // get all query variables,
        while (tuples.length > 0) {
            code = b.getId(tuples.pop());
            var v = b.get(code);
            var type = b.get(v.type);
            
            if (type === 'variable') {
                if (variables.indexOf(code) === -1) {
                    variables.push(code);
                }
            }
            else if (type === 'tuple') {
                var data = b.get(v.data);
                tuples = tuples.concat(data);
            }
        }
        
        // find nots that can be executed,
        for (var i=nots.length-1; i >= 0; i--) {
            tuples = [nots[i]];
            var execute = true;
            
            while (tuples.length > 0) {
                code = b.getId(tuples.pop());
                v = b.get(code);
                
                if (v.exists !== undefined) {
                    execute = false;
                    break;
                }
                
                type = b.get(v.type);
                
                if (type === 'variable') {
                    
                    if (variables.indexOf(code) !== -1) {
                        execute = false;
                        break;
                    }
                }
                else if (type === 'tuple') {
                    data = b.get(v.data);
                    tuples = tuples.concat(data);
                }
            }
            
            if (execute) {
                var neg = b.getObject(nots[i]);
                
                var nQuery = b.zvs.add(
                    prepare.query(neg)
                );
                
                var branch = b.zvs.change(
                    "definitions", [
                        definitionsHash
                    ]
                );
                
                var results = b.zvs.change("query", [nQuery], branch);
    
                if (results && results.length > 0) {
                    b.notes({status: {fail: true, reason: "negation fail!"}});
                    return false;                
                }
                else {
                    b.update(nots[i], {exists: false});
                }
            }
        }
    }
    
    return true;
}

module.exports = negation;

