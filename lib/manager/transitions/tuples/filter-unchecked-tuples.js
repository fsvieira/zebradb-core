"use strict";
const utils = require("../../../utils");

function getUncheckedTuples (zvs, branchId, tupleId) {
	const unchecked = [];
	const tuples = [zvs.branches.getDataId(branchId, tupleId)];
	const done = [];

	while (tupleId = tuples.pop()) {
		if (!done.includes(tupleId)) {
			done.push(tupleId);

			const tuple = zvs.getData(branchId, tupleId);
			const tupleData = zvs.getData(branchId, tuple.data);
			const tupleChecked = zvs.getData(branchId, tuple.check);

			if (!tupleChecked) {
				unchecked.push(tupleId);
			}

			for (let i=0; i<tupleData.length; i++) {
				const vId = zvs.branches.getDataId(branchId, tupleData[i]);
				const vData = zvs.getData(branchId, vId);
				const vType = zvs.getData(branchId, vData.type);

				if (vType === 'tuple') {
					tuples.push(vId);
				}
			}
		}
	}

	return unchecked;
}

function _filterUncheckedTuples (req, res) {
	const { branchId, queryId } = req.args;
	const { zvs } = req.context;

	// let {tuples, domainId} = getUncheckedTuples(zvs, branchId, queryId);
	let tuples = getUncheckedTuples(zvs, branchId, queryId);

	res.send({
		value: {
			branchId,
			tuples 
		}
	});
}

function filterUncheckedTuples (action, data, destination, session) {
	const { branchId, queryId } = data;
	const zvs = session.zvs;

	// let {tuples, domainId} = getUncheckedTuples(zvs, branchId, queryId);
	let tuples = getUncheckedTuples(zvs, branchId, queryId);

	session.postOffice.addActives(destination, 1);
	if (tuples.length === 0) {
		session.queue.put({
			action: "filterUncheckedNegations",
			data: {
				branchId,
				tuples 
			},
			destination
		});
	}
	else {
		session.queue.put({
			action: "matchTuples",
			data: {
				branchId,
				tuples 
			},
			destination
		});
	}

	session.postOffice.subActives(destination, 1);
}

module.exports = filterUncheckedTuples;
