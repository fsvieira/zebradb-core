const unify = require("../../unify");

function actionUnify (zvs, {branchId: parentBranchId, args: [p, q]}, evalNegation, noUpdate) {
	const parent = zvs.branches.getRawBranch(parentBranchId);
	
	if (parent.metadata) {
	    Object.freeze(parent.metadata.changes);
	}
	
	const branchId = zvs.branches.branchHash({
	    parent: parentBranchId,
		args: [p, q],
		action: "unify",
		level: parent.data.level + 1
	});
	
	const r = unify(zvs, branchId, p, q, evalNegation, noUpdate);

	if (!r) {
		zvs.branches.end(branchId, true, "unify fail!");
	}
	
	return r;
}

module.exports = actionUnify;

