const utils = require("../../utils");

/*
    1. Send all single branches,
    2. Send all branches that eval negations,
    3. Don't send uneval negations.

*/

function select (zvs) {
    return function (value) {
/*
        console.log(
            "-- VALUES START --\n" +
            value.map(branches => {
                return "{" + branches.map(b => {
                    return utils.toString(zvs.getObject(b.branchId, b.tuple), true);
                }).join("\n") + "}";
            }).join("\n\n")
            + "\n-- VALUES END --\n"
        );
  */      
        return new Promise(function (resolve, reject) {
            let branches = [];

            for (let i=0; i<value.length; i++) {
                const nbranches = value[i];
                
                if (nbranches.length === 1) {
                    branches.push(nbranches);
                }
            }
            
            if (branches.length === 0) {
                let min = Infinity;
                let minNegations = Infinity;

                for (let i=0; i<value.length; i++) {
                    const nbranches = value[i];
                    let existsCounter = 0;
                    nbranches.maxNegations = 0;

                    for (let j=0; j<nbranches.length; j++) {
                        const branchId = nbranches[j].branchId;
                        const ns = zvs.getData(branchId, zvs.getData(branchId, zvs.data.global("query")).negation);
                                
                        if (ns) {
                            if (minNegations > ns.length) {
                                minNegations = ns.length;
                            }
                            
                            if (nbranches.maxNegations < ns.length) {
                                nbranches.maxNegations = ns.length;
                            }
                            
                            const r = ns.filter(tupleId => {
                                const tuple = zvs.getData(branchId, tupleId);
                                const exists = zvs.getData(branchId, tuple.exists);
                                return exists !== undefined;
                            });
                                    
                            existsCounter += r.length;
                        }
                        else {
                            minNegations = 0;
                        }
                    }
                    
                    if (min > existsCounter) {
                        min = existsCounter;
                    }
                    
                    nbranches.existsCounter = existsCounter;
                }

                const negations = value.filter(branches => branches.existsCounter > min);

                if (negations.length) {
                    branches = negations;
                }
                else {
                    const ns = value.filter(branches => branches.maxNegations === minNegations);
                    if (ns.length) {
                        const vs = ns.reduce((acc, v) => {
                           const value = acc.dict[v.length] = acc[v.length] || [];
                           value.push(v);
                           
                           if (acc.values.indexOf(value) === -1) {
                              acc.values.push(value);
                           }
                           
                           return acc;
                        }, {dict: {}, values: []}).values;

                        vs.sort((a, b) => {
                            const atotal = Math.pow(a[0].length, a.length);
                            const btotal = Math.pow(b[0].length, b.length);
                            
                            return atotal - btotal;
                        });

                        branches = vs[0];
                    }
                    else {
                        // branches = value;
                        const vs = value.reduce((acc, v) => {
                           const value = acc.dict[v.length] = acc[v.length] || [];
                           value.push(v);
                           
                           if (acc.values.indexOf(value) === -1) {
                              acc.values.push(value);
                           }
                           
                           return acc;
                        }, {dict: {}, values: []}).values;

                        vs.sort((a, b) => {
                            const atotal = Math.pow(a[0].length, a.length);
                            const btotal = Math.pow(b[0].length, b.length);
                            
                            return atotal - btotal;
                        });

                        branches = vs[0];
                    }
                }
            }
            
            /*
            console.log(
            "-- SEND START --\n" +
                branches.map(branches => {
                    return "{" + branches.map(b => {
                        return utils.toString(zvs.getObject(b.branchId, b.tuple), true);
                    }).join("\n") + "}";
                }).join("\n\n")
                + "\n-- SEND END --\n"
            );*/
            
            branches = branches.map(m => m.map(v => v.branchId));
            resolve({value: branches});
        });
    };
}


module.exports = select;