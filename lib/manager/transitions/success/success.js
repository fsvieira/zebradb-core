"use strict";

const utils = require("../../../utils");

function success (req, res) {
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

module.exports = success;
