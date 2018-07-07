"use strict";

const actionUnify = require("./actionUnify");

function getVariables (zvs, branchId, tupleId) {
	const tuples = [tupleId];
	const done = [tupleId];
	const variables = [];

	while(tuples.length) {
		const tupleId = tuples.pop(); 
		const tuple = zvs.getData(branchId, tupleId);
		const data = zvs.getData(branchId, tuple.data);

		for (let i=0; i<data.length; i++) {
			const id = zvs.branches.getDataId(branchId, data[i]);
			const v = zvs.getData(branchId, id);
			const type = zvs.getData(branchId, v.type);

			if (type === "tuple") {
				if (!done.includes(id)) {
					tuples.push(id);
					done.push(id);
				}
			}
			else if (type === 'variable') {
				if (!variables.includes(id)) {
					variables.push(id);
				}
			}
		}
	}

	return variables;
}

function check (req, res) {
	const { zvs } = req.context;
	const { branchId, tuples: mergeTuples } = req.args;

	const queryId = zvs.data.global("query");
	const merge = [];

	for (let i = 0; i < mergeTuples.length; i++) {
		const { tuple, definitions } = mergeTuples[i];
		const r = [];

		for (let j = 0; j < definitions.length; j++) {
			const { negation, definition } = definitions[j];
			const unifyBranchId = actionUnify(
				zvs, { branchId, args: [tuple, definition] }
			);

			if (unifyBranchId) {
				if (negation && negation.length > 0) {
					const query = Object.assign({},
						zvs.getData(unifyBranchId, queryId)
					);

					const qnegation = zvs.getData(
						unifyBranchId,
						query.negation
					).slice(0);

					for (let n = 0; n < negation.length; n++) {
						const nId = zvs.data.add(negation[n]);

						if (qnegation.indexOf(nId) === -1) {
							qnegation.push(nId);
						}
					}

					query.negation = zvs.data.getId(qnegation.sort());
					zvs.branches.transform(
						unifyBranchId,
						queryId,
						zvs.data.getId(query)
					);
				}

				r.push(unifyBranchId);
			}
		}

		if (r.length > 0) {
			merge.push({
				branches: r,
				variables: getVariables(zvs, branchId, tuple),
				tupleId: tuple
			});
		}
		else {
			// branch fails,
			// TODO: we need to mark branch as fail.
			res.send({});
			return;
		}
	}

	// TODO: should we pass original branchId,
	res.send({ value: { branches: merge, branchId } });
}

module.exports = check;
