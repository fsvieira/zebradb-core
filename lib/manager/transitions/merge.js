const actionUnify = require("./unify");

function hasIntersection (zvs, aBranches, bBranches) {
    const ids = {};
    var hits = 0;
    
    for (var i=0; i<aBranches.length; i++) {
        const branch = zvs.branches.getRawBranch(aBranches[i]);
        
        for (var id in branch.metadata.changes) {
            ids[id] = true;
            ids[branch.metadata.changes[id]] = true;
        }
    }
    
    
    for (var i=0; i<bBranches.length; i++) {
        const branch = zvs.branches.getRawBranch(bBranches[i]);
        
        for (var id in branch.metadata.changes) {
            if (ids[id] || ids[branch.metadata.changes[id]]) {
                hits++;
            }
        }
    }
    
    return hits;
}


function select (zvs, value) {
    // get all branches intersect, 
    // choose 2 that have higth intersect number.

    var results = [];

    for (var i=0; i<value.length; i++) {
        const aBranches = value[i];
        
        for (var j=i+1; j<value.length; j++) {
            const bBranches = value[j];

            const hits = hasIntersection(zvs, aBranches, bBranches);

            if (hits > 0) {
                results.push({
                    branches: {
                        a: aBranches,
                        b: bBranches
                    },
                    index: {i, j},
                    hits
                });
            }
        }
    }

    if (results.length > 0) {
        results.sort(function (a, b) {
           return b.hits - a.hits || (a.branches.a.length * a.branches.b.length) - (b.branches.a.length * b.branches.b.length);
        });

        // console.log(results.map(r => r.hits + "::" + (r.branches.a.length * r.branches.b.length)).join(", "));
        // console.log(JSON.stringify(results, null, '\t'));
        
        const r = results[0];

        value.splice(r.index.j, 1);
        value.splice(r.index.i, 1);
        
        return r.branches;
    }

    value.sort(function (a, b) {
        return b.length - a.length;
    });
    
    // console.log("L = " + value.map(r => r.length).join(", "));
    
    return {
        a: value.pop(),
        b: value.pop()
    };
    
}

function merge (zvs, neg, events) {

    return function (value) {
        return new Promise(function (resolve, reject) {
            var bs;

            value.pWhile(function (value, wResolve) {

                if (value.length <= 1) {
                    resolve({values: value[0]});
                    wResolve(false);
                    return;
                }
                
                /*value = value.sort(function (a, b) {
                    return b.length - a.length;
                });*/
        
                /*const a = value.pop();
                const b = value.pop();*/
                const {a, b} = select(zvs, value);

                var nr = [];
    
                for (var i=0; i<a.length; i++) {
                    var bA = a[i];
                    for (var j=0; j<b.length; j++) {
                        var bB = b[j];
                        
                        // bA * bB
                        bs = zvs.merge([bA, bB], function (...args) {
                            const r = actionUnify(...args);
                            /*if (r) {
                                events.trigger('branch', {branchId: r});
                            }*/
                            
                            return r;
                        }, "unify&merge");
                        
                        if (bs && bs.length) {
                            /*
                            bs.forEach(function (branchId) {
                                events.trigger('branch', {branchId});
                            });*/
                            
                            nr = nr.concat(bs);
                        }
                    }
                }

                if (nr.length === 0) {
                    // fail,
                    // TODO: we need to fail father branch,
                    // zvs.branches.notes(branchId, {status: {fail: true, reason: "merge fail!"}});
                    resolve({});
                    wResolve(false);
                    return;    
                }
                
                const p = nr.map(function (branchId) {
                    return neg({branchId});
                });
                
                Promise.all(p).then(function (v) {
                    const r = [];
                    
                    for (var i=0; i<v.length; i++) {
                        if (v[i].value) {
                            r.push(v[i].value.branchId);
                        }
                    }
                    
                    if (r.length) {
                        value.push(r);
                        wResolve(true);
                    }
                    else {
                        // TODO: mark branch fail
                        resolve({});
                        wResolve(false);
                    }
                });
            });
        });
    };
}

module.exports = merge;
