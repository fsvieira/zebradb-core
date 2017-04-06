var prepare = require("./prepare");
var utils = require("./utils");

function negation (b) {
    var definitionsHash = b.get(b.global("definitions")).definitions;
    var q = b.global("query");
    
    var nots = b.get(b.get(q).negation);

    if (nots && nots.length > 0) {
        nots = nots.slice();
        var tuples = [q];
        var code;
        
        var variables = [];
    
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
        
        // get nots variables,
        var executeNegation = [];

        for (var i=nots.length-1; i >= 0; i--) {
            tuples = [nots[i]];
            var execute = true;
            
            while (tuples.length > 0) {
                code = b.getId(tuples.pop());
                v = b.get(code);
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
                executeNegation.push(b.getId(nots[i]));
                nots.splice(i, 1);
            }
        }

        // Update globals,
        if (executeNegation.length > 0) {
            b.update(q, {
                negation: nots.map(function (o) {
                    return b.getObject(o);
                })
            });

            // Execute nots,
            for (var i=0; i<executeNegation.length; i++) {
                var neg = b.getObject(executeNegation[i]);
                
                var nQuery = b.zvs.add(
                    prepare.query(neg)
                );
                
                // console.log("NQ: " + utils.toString(b.getObject(nQuery)));
                
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
            }
        }
    }

    return true;
}

module.exports = negation;

