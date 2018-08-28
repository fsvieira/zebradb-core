"use strict";

const utils = require("../../../utils");

function getTuplesDefinitions (branchId, tuples, match) {
	const matchTuples = {};

	for (let i = 0; i < tuples.length; i++) {
		const tupleID = tuples[i];
		const definitions = match.match(branchId, tupleID);

		if (definitions && definitions.length) {
			matchTuples[tupleID] = definitions;
		}
		else {
			return;
		}
	}

	return matchTuples;
}

function _matchTuples (req, res) {
	const { branchId, tuples } = req.args;
	const { zvs } = req.context;
	const ddata = zvs.getData(branchId, zvs.data.global("definitions")).data;
	const definitionsBranchId = zvs.getData(
		branchId,
		zvs.getData(branchId, ddata).branchId
	);

	const match = zvs.definitionsMatch[definitionsBranchId];

	// Get tuples definitions,
	const matchTuples = getTuplesDefinitions(branchId, tuples, match);

	if (!matchTuples) {
		res.send({});
		return;
	}

	const tuplesDefinitions = tuples.map(tuple => {
		return {
			tuple,
			definitions: matchTuples[tuple]
		};
	});

	if (tuplesDefinitions) {
		res.send({
			value: {
				branchId,
				tuples: tuplesDefinitions
			}
		});
	}
	else {
		res.send({});
	}
}

function matchTuples (action, data, destination, session) {
	const { branchId, tuples } = data;
	const zvs = session.zvs;
	const ddata = zvs.getData(branchId, zvs.data.global("definitions")).data;
	const definitionsBranchId = zvs.getData(
		branchId,
		zvs.getData(branchId, ddata).branchId
	);

	const match = zvs.definitionsMatch[definitionsBranchId];

	// Get tuples definitions,
	const matchTuples = getTuplesDefinitions(branchId, tuples, match);

	if (!matchTuples) {
		session.postOffice.subActives(destination, 1);
		return;
	}

	const tuplesDefinitions = tuples.map(tuple => {
		return {
			tuple,
			definitions: matchTuples[tuple]
		};
	});

	if (tuplesDefinitions) {
		session.postOffice.addActives(destination, 1);

		session.queue.put({
			action: "copyDefinitions",
			data: {
				branchId,
				tuples: tuplesDefinitions
			},
			destination
		});

		session.postOffice.subActives(destination, 1);
	}
	else {
		session.postOffice.subActives(destination, 1);
	}
}

module.exports = matchTuples;
