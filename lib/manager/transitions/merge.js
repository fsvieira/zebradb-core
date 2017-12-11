const actionUnify = require("./unify");
const utils = require("../../utils");

function intersections (zvs, aBranches, bBranches) {
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
    
    return hits / bBranches.length;
}


function select (zvs, value) {
    // get all branches intersect, 
    // choose 2 that have higth intersect number.

    var results = [];

    for (var i=0; i<value.length; i++) {
        const aBranches = value[i];
        
        for (var j=i+1; j<value.length; j++) {
            const bBranches = value[j];
            const rs = aBranches.length * bBranches.length;
    
            const hits = intersections(zvs, aBranches, bBranches);
    
            if (hits > 0) {
                results.push({
                    branches: {
                        a: aBranches,
                        b: bBranches
                    },
                    index: {i, j},
                    rs,
                    hits
                });
            }
        }
    }

    if (results.length > 0) {
        results.sort(function (a, b) {
           return b.hits - a.hits || a.rs - b.rs;
        });

        // console.log(results.length + " % " + value.length + " => " + results.map(r => r.hits + "::" + (r.branches.a.length * r.branches.b.length)).join(", "));
        // console.log(JSON.stringify(results, null, '\t'));
        
        const r = results[0];

        value.splice(r.index.j, 1);
        value.splice(r.index.i, 1);
        
        return r.branches;
    }

    value.sort(function (a, b) {
        return a.length - b.length;
    });    
    
    // console.log("L = " + value.map(r => r.length).join(", "));
    
    return {
        a: value.shift(),
        b: value.shift()
    };
    
}

function merge (req, res) {
    const {zvs} = req.context;
    const {branches} = req.args;
    
    const results = [];
    
    /*
        we need to make sure that single branches 
        pass the merge phase.
    */
    const singles = [];

    for (let i=branches.length-1; i>=0; i--) {
        const bs = branches[i];
        
        if (bs.length === 1) {
            singles.push(bs[0]);
            branches.splice(i, 1);
        }
    }

    if (singles.length) {
        while (singles.length > 1) {
            const bA = singles.pop();
            const bB = singles.pop();

            const s = zvs.merge(
                [bA, bB], 
                (...args) => actionUnify(...args),
                "unify&merge"
            );
            
            if (s) {
                console.log(
                    "--- Merge Single --\n" +
                    utils.toString(zvs.getObject(bA, zvs.data.global("query")), true) + " ** " +
                    utils.toString(zvs.getObject(bB, zvs.data.global("query")), true) + " = " +
                    utils.toString(zvs.getObject(s[0], zvs.data.global("query")), true)
                );
                
                singles.push(s[0]);
            }
            else {
                res.send({});
                return;
            }
        }
        
        if (branches.length === 1) {
            branches.push(singles);
        }
        else {
            results.push(singles);
        }
    }

    while (branches.length > 1) {
        const {a, b} = select(zvs, branches);

        if (a.length * b.length < 100) {

            let nr = [];
        
            for (let i=0; i<a.length; i++) {
                const bA = a[i];
        
                for (let j=0; j<b.length; j++) {
                    var bB = b[j];

                    // bA * bB
                    let bs = zvs.merge(
                        [bA, bB], 
                        (...args) => actionUnify(...args),
                        "unify&merge"
                    );
                    
                    console.log(
                        "--- Merge " + bs.length +" --\n" +
                        utils.toString(zvs.getObject(bA, zvs.data.global("query")), true) + " ** " +
                        utils.toString(zvs.getObject(bB, zvs.data.global("query")), true) + " = " +
                        utils.toString(zvs.getObject(bs[0], zvs.data.global("query")), true)
                    );
                        
                    if (bs && bs.length) {
                        nr = nr.concat(bs);
                    }
                }
            }
            
            if (nr.length === 0) {
                // everything fails,
                // fail,
                // TODO: we need to fail father branch,
                // zvs.branches.notes(branchId, {status: {fail: true, reason: "merge fail!"}});
                
                res.send({});
                return;
            }
            
            results.push(nr);
        }
        else {
            branches.push(a.length < b.length?a:b);
        }
    }

    if (branches.length > 0) {
        results.push(branches[0]);
    }

    res.send({value: {branches: results}});
}

module.exports = merge;
