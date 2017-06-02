const prepare = require("../prepare");

function definitions (zvs, {branchId: parentBranchId, args: [defsHash]}) {
    const parent = zvs.branches.getRawBranch(parentBranchId);
	
	if (parent.metadata) {
	    Object.freeze(parent.metadata.changes);
	}
	
	const branchId = zvs.branches.branchHash({
	    parent: parentBranchId,
		args: [defsHash],
		action: "definitions",
		level: parent.data.level + 1
	});

    var defs = zvs.getData(branchId, defsHash);

    defs = prepare.uniq_fast(defs);

    var definitionsList = defs.map(function (d) {
        return zvs.getObject(branchId, d);
    });


    zvs.update(branchId, zvs.data.global("definitions"), {definitions: definitionsList});
    
    return branchId;
}

module.exports = definitions;
