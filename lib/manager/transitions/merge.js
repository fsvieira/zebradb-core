const actionUnify = require("./unify");

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
                
                value = value.sort(function (a, b) {
                    return b.length - a.length;
                });        
        
                const a = value.pop();
                const b = value.pop();

                var nr = [];
    
                for (var i=0; i<a.length; i++) {
                    var bA = a[i];
                    for (var j=0; j<b.length; j++) {
                        var bB = b[j];
                        
                        // bA * bB
                        bs = zvs.merge([bA, bB], function (...args) {
                            const r = actionUnify(...args);
                            if (r) {
                                events.trigger('branch', {branchId: r});
                            }
                            
                            return r;
                        }, "unify&merge");
                        
                        if (bs && bs.length) {
                            bs.forEach(function (branchId) {
                                events.trigger('branch', {branchId});
                            });
                            
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
