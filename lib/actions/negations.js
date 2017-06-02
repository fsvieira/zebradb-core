const negation = require("../negation");
const prepare = require("../prepare");

function negations (zvs, {branchId: parentBranchId, args: [ns]}) {
    const parent = zvs.branches.getRawBranch(parentBranchId);
	
	if (parent.metadata) {
	    Object.freeze(parent.metadata.changes);
	}
	
	const branchId = zvs.branches.branchHash({
	    parent: parentBranchId,
		args: [ns],
		action: "negations",
		level: parent.data.level + 1
	});

    var query = zvs.data.global("query");
    var queryObj = zvs.getData(branchId, query);
    var negations = prepare.union(zvs, branchId, zvs.getData(branchId, ns) || [], zvs.getData(branchId, queryObj.negation) || []);

    zvs.update(branchId, query, {negation: negations});
    return negation(zvs, branchId)?branchId:undefined;
}

module.exports = negations;
