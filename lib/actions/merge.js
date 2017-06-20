const actionUnify = require("./unify");

function merge (zvs) {
    return function (value) {
        return new Promise(function (resolve, reject) {
            var bs;
            
            while (value.length > 1) {
                var a = value.pop();
                var b = value.pop();
        
                var nr = [];
    
                for (var i=0; i<a.length; i++) {
                    var bA = a[i];
                    for (var j=0; j<b.length; j++) {
                        var bB = b[j];
                        
                        // bA * bB
                        bs = zvs.merge([bA, bB], actionUnify, "unify&merge");
                        
                        if (bs && bs.length) {
                            // TODO: merge negations,
                        
                            nr = nr.concat(bs);
                        }
                    }
                }
    
                
                if (nr.length === 0) {
                    // fail,
                    // TODO: we need to fail father branch,
                    // zvs.branches.notes(branchId, {status: {fail: true, reason: "merge fail!"}});
                    resolve({});
                    return;    
                }
                
                value.push(nr);
            }
            
            resolve({values: value[0]});
        });
    };
}

module.exports = merge;
