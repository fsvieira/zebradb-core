"use strict";

function getUncheckedTuples (zvs, branchId, tupleId) {
	const unchecked = [];
	const domains = [];
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
				else if (vType === 'domain' && !domains.includes(vId)) {
					// TODO: we need to mark checked domains,
					domains.push(vId);
				}
			}
		}
	}

	let domainId;
	if (tuples.length === 0) {
		domainId = filterUncheckedDomains(zvs, branchId, domains);
	}

	return {tuples: unchecked, domainId};
}

function filterUncheckedDomains (zvs, branchId, domains) {
	for (let i=0; i<domains.length; i++) {
		const domainId = domains[i];

		const data = zvs.getData(branchId, domainId);
		const values = zvs.getData(branchId, data.data);

		for (let j=0; j<values.length; j++) {
			const vId = values[j]; 
			const v = zvs.getData(branchId, vId);
			const type = zvs.getData(branchId, v.type);

			if (type === 'tuple') {
				const {tuples, domains} = getUncheckedTuples(zvs, branchId, vId);

				if (tuples.length) {
					return domainId;
				}
			}
		}
	}
}

function filterUncheckedTuples (req, res) {
	const { branchId, queryId } = req.args;
	const { zvs } = req.context;

	let {tuples, domainId} = getUncheckedTuples(zvs, branchId, queryId);

//	if (tuples) {
		res.send({
			value: {
				branchId,
				tuples,
				domainId
			}
		});
/*	}
	else {
		res.send({});
	}*/
}

module.exports = filterUncheckedTuples;
