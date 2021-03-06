"use strict";

const Match = require("../../../match/match");
const ZVS = require("../../../zvs/zvs");
const utils = require("../../../utils");

function checkDefinition (zvs, branchId, tupleId, match) {
	const tuples = [tupleId];
	const done = [tupleId];

	while (tuples.length) {
		const tupleId = tuples.pop();

		const m = match.match(branchId, tupleId);

		if (!m || m.length === 0) {
			return false;
		}

		const data = zvs.getData(branchId, zvs.getData(branchId, tupleId).data);

		for (let i = 0; i < data.length; i++) {
			const id = data[i];
			const v = zvs.getData(branchId, id);
			const type = zvs.getData(branchId, v.type);

			if (type === "tuple") {
				if (done.indexOf(id) === -1) {
					done.push(id);
					tuples.push(id);
				}
			}
		}
	}

	return true;
}

function checkDefinitions (failRecover) {
	return (action, data, destination, session) => {
		const { query, definitions } = data;

		const tmpZVS = new ZVS();
		const definitionsIds = definitions.map(d => tmpZVS.data.add(d));

		const match = new Match(tmpZVS);

		match.addTuples(definitionsIds);

		for (let i = definitionsIds.length - 1; i >= 0; i--) {
			if (!checkDefinition(
					tmpZVS,
					tmpZVS.branches.root,
					definitionsIds[i],
					match
				)
			) {

				if (failRecover) {
					definitions.splice(i, 1);
				}
				else {
					const definition = definitions[i];

					session.postOffice.abort(
						destination, 
						{
							status: 'error',
							data: {
								message: "Invalid definition: " +
									utils.toString(definition) +
									", before query: " +
									utils.toString(query.data) 
							}
						}
					);

					return;
				}
			}
		}

		if (action === "checkDefinitions") {
			session.postOffice.addActives(destination, 1);
			session.queue.put({
				action: "multiplyDefinitions",
				data: {
					query,
					definitions
				},
				destination
			});	
		}
		else if (action === "checkMultiplyDefinitions"){
			session.postOffice.addActives(destination, 1);
			session.queue.put({
				action: "prepareQuery",
				data: {
					query,
					definitions
				},
				destination
			});
		}

		session.postOffice.subActives(destination, 1);
	};
}

module.exports = checkDefinitions;
