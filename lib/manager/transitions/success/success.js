"use strict";

const utils = require("../../../utils");

function _success (req, res) {
	const { args: {branchId}, trackIds } = req;
	const { zvs, events } = req.context;
	const queryBranchId = zvs.getObject(
		branchId,
		zvs.data.global("queryBranchId")
	).data;

	zvs.branches.end({
		rootBranchId: queryBranchId,
		branchId,
		success: true
	});

	trackIds.forEach(
		trackId => events.trigger("success", {trackId, branchId})
	);

	res.send({});
}

function success (action, data, destination, session) {
	const {branchId} = data;
	const zvs = session.zvs;

	const queryBranchId = zvs.getObject(
		branchId,
		zvs.data.global("queryBranchId")
	).data;

	zvs.branches.end({
		rootBranchId: queryBranchId,
		branchId,
		success: true
	});

	console.log(destination);
	// session.postOffice.
	session.postOffice.push(destination, branchId);
	session.postOffice.subActives(destination, 1);
}

module.exports = success;
