"use strict";
const utils = require("../../../utils");

function checkDepth (req, res) {
	const branchId = req.args;
	const { zvs } = req.context;

	const settings = zvs.getObject(branchId, zvs.data.global("settings"));

	if (settings && settings.data && settings.data.depth !== undefined) {
		const branch = zvs.branches.getRawBranch(branchId);
		if (branch.data.level > settings.data.depth) {
			zvs.branches.end({
				branchId,
				fail: true,
				reason: "max depth reached"
			});

			res.send({});
			return;
		}
	}

	res.send({ value: branchId });
}

module.exports = checkDepth;
