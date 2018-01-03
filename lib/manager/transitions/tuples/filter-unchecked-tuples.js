"use strict";

function getUncheckedTuples (zvs, branchId, q, tuples) {
	// normalize id,
	q = zvs.branches.getDataId(branchId, q);

	tuples = tuples || [];

	if (tuples.indexOf(q) === -1) {
		let d = zvs.getData(branchId, q);

		if (zvs.getData(branchId, d.type) === "tuple") {
			if (!d.check || !zvs.getData(branchId, d.check)) {
				tuples.push(q);
			}

			let data = zvs.getData(branchId, d.data);
			for (let i = 0; i < data.length; i++) {
				getUncheckedTuples(zvs, branchId, data[i], tuples);
			}
		}
	}

	return tuples;
}

function filterUncheckedTuples (req, res) {
	const { branchId, queryId } = req.args;
	const { zvs } = req.context;

	const tuples = getUncheckedTuples(zvs, branchId, queryId);

	if (tuples) {
		res.send({
			value: {
				branchId,
				tuples
			}
		});
	}
	else {
		res.send({});
	}
}

module.exports = filterUncheckedTuples;
