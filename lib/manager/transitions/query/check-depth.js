"use strict";
const utils = require("../../../utils");

function _checkDepth (req, res) {
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

	// utils.printQuery(zvs, branchId, "Check Depth");

	res.send({ value: branchId });
}

function checkDepth (action, data, destination, session) {
	const branchId = data;
	const zvs = session.zvs;

	const settings = zvs.getObject(branchId, zvs.data.global("settings"));

	if (settings && settings.data && settings.data.depth !== undefined) {
		const branch = zvs.branches.getRawBranch(branchId);
		if (branch.data.level > settings.data.depth) {
			zvs.branches.end({
				branchId,
				fail: true,
				reason: "max depth reached"
			});

			session.postOffice.subActives(destination, 1);

			return;
		}
	}

	// utils.printQuery(zvs, branchId, "Check Depth");
	session.postOffice.addActives(destination, 1);

	session.queue.put({
		action: "updateQuery",
		data: branchId,
		destination
	});

	session.postOffice.subActives(destination, 1);

}


module.exports = checkDepth;
