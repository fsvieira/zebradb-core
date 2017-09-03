var ZVS = require("./zvs/zvs");
var utils = require("./utils");
var prepare = require("./prepare");

// TODO: put unify into operators.
const actionUnify = require("./manager/transitions/unify");

// --- multiply ---
function _multiply (zvs, r) {
    if (r) {
        var branchA, branchB, ms, branches, newBranches;
        
        branches = r;
        
        for (var i=0; i<branches.length; i++) {
            branchA = branches[i];
            newBranches = [];
            
            for (var j=i+1; j<branches.length; j++) {
                branchB = branches[j];
                
                ms = zvs.merge([branchA, branchB], actionUnify);
                
                if (ms && ms.length > 0) {
                    r = r.concat(ms);
                    newBranches = newBranches.concat(ms);
                }
            }
            
            branches = newBranches;
        }
    }
    
    return r;
}

function multiply (definitions) {
    
    var zvs = new ZVS();
    var results = [];
    var p, q, r, s;
    var dup = {};
    
    
    for (var i=0; i<definitions.length; i++) {
        p = zvs.data.add(definitions[i]);
        r = [];
        
        for (var j=i; j<definitions.length; j++) {
            q = zvs.data.add(definitions[j]);
            
            const result = actionUnify(zvs, {branchId: zvs.branches.root, args: [p, q]});
            
            if (result) {
                r.push(result);
            }
        }
        
        r = _multiply(zvs, r);

        for (var j=0; j<r.length; j++) {
            q = zvs.getObject(r[j], p);
            s = utils.toString(q, true);

            if (!dup[s]) {
                dup[s] = true;
                results.push(q);
            }
        }
    }
    
    return prepare.definitions(results);
}


module.exports = multiply;

