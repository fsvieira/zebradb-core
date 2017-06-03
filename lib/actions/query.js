const planner = require("../planner");
const negation = require("../negation");
const prepare = require("../prepare");
const negations = require("./negations");
const actionUnify = require("./unify");

function check (zvs, branchId, q, defs) {
    var r = [];

    var virtual = zvs.getObject(branchId, q).virtual;
    
    if (virtual) {
        defs = defs.filter(function (d) {
           var code = d.virtual.code;
           
           return virtual.transitions.indexOf(code) !== -1;
        });
    }

    for (var i=0; i<defs.length; i++) {
        var c = prepare.copyWithVars(defs[i], {
            uniqueId: function () {
                return zvs.branches.getUniqueId(branchId);
            }
        });
        var negation = c.negation;
        
        delete c.negation;
        var def = zvs.data.add(c);
        
        var branch = actionUnify(zvs, {branchId, args: [q, def]}, true); // (zvs, {branchId, args: [q, def]});

        if (branch && negation && negation.length > 0) {
            var n = zvs.data.add(negation);
            branch = negations(zvs, {branchId: branch, args: [n]});
        }

        if (branch) {
            r.push(branch);
        }
    }
    
    return r;
}

function query (zvs, success$, {branchId: parentBranchId, args: [q]}) {
    const parent = zvs.branches.getRawBranch(parentBranchId);
	
	if (parent.metadata) {
	    Object.freeze(parent.metadata.changes);
	}
	
	const branchId = zvs.branches.branchHash({
	    parent: parentBranchId,
		args: [q],
		action: "query",
		level: parent.data.level + 1
	});
    
    var r = [];
    var bs, branches;

    if (q) {
        zvs.branches.transform(branchId, zvs.data.global("queryBranchId"), zvs.data.add({type: 'queryBranchId', data: branchId}));
        zvs.branches.transform(branchId, zvs.data.global("query"), q);
    }
    else {
        q = zvs.data.global("query");
    }

    var settings = zvs.getObject(branchId, zvs.data.global("settings"));
    var defs = zvs.getObject(branchId, zvs.data.global("definitions")).definitions;

    if (settings.deep && zvs.branches.getLevel(branchId) > settings.deep) {
        zvs.branches.notes(branchId, {status: {fail: true, reason: "max deep limits exceded!"}});
        return;
    }

    if (!negation(zvs, branchId, true)) {
        return;
    }

    // choose tuples to evaluate,
    var tuples = planner(zvs, branchId, q);

    if (tuples && tuples.length > 0) {

        for (var i=0; i<tuples.length; i++) {
            branches = check(zvs, branchId, tuples[i], defs);
            
            if (branches.length === 0) {
                // fail
                zvs.branches.notes(branchId, {status: {fail: true, reason: "check fail!"}});
                return;
            }
            else {
                r.push(branches);
            }
        }
        
        while (r.length > 1) {
            var a = r.pop();
            var b = r.pop();
    
            var nr = [];

            for (var i=0; i<a.length; i++) {
                var bA = a[i];
                for (var j=0; j<b.length; j++) {
                    var bB = b[j];
                    
                    // bA * bB
                    bs = zvs.merge([bA, bB], actionUnify, "unify&merge");
                    
                    if (bs && bs.length) {
                        for (var bi=bs.length-1; bi>=0; bi--) {
                            if (!negation(zvs, bs[bi])) {
                                bs.splice(bi, 1);
                            }
                        }
                    
                        nr = nr.concat(bs);
                    }
                }
            }

            
            if (nr.length === 0) {
                // fail,
                zvs.branches.notes(branchId, {status: {fail: true, reason: "merge fail!"}});
                return;    
            }
            
            r.push(nr);
        }
        
        r = r[0];
    }
    else {
        if (success$) {
            success$({branchId});
        }
        
        return [branchId];
    }


    branches = undefined;
    if (r.length > 0) {
        branches = [];
        for (var i=0; i<r.length; i++) {
            bs = query(zvs, success$, {branchId: r[i], args: []});
            
            if (bs) {
                for (var j=0; j<bs.length; j++) {
                    if (branches.indexOf(bs[j]) === -1) {
                        branches.push(bs[j]);
                    }
                }
            }
        }
    }
    else {
        zvs.branches.notes(branchId, {status: {fail: true, reason: "no results!"}});
    }

    return branches;
}

module.exports = query;

