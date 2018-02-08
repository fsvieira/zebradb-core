"use strict";

const Match = require("../../../match/match");
const ZVS = require("../../../zvs/zvs");
const utils = require("../../../utils");

function invalidDefinitionsError (query, definition, events) {
	return trackId => events.trigger(
		"error",
		{
			trackId,
			error:
				"Invalid definition: " +
				utils.toString(definition) +
				", before query: " +
				utils.toString(query.data)
		}
	);
}

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
	return (req, res) => {
		const { events } = req.context;
		const { query, definitions } = req.args;

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
				)) {

				if (failRecover) {
					definitions.splice(i, 1);
				}
				else {
					/*
                        TODO:
                            - Need to decide how to handle errors,
                            	we should abort everything?
                            - Running executions are still valid ...
                            - All future executions are invalid.

                        TODO:
                            - give more information about definition in fault,
                            	like what subtuple,
	                           if possible what line and what column.
                    */
                    req.trackIds.forEach(
                    	invalidDefinitionsError(query, definitions[i], events)
                    );

					res.send({});

					return;
				}
			}
		}

		res.send({ value: { query, definitions } });
	};
}

module.exports = checkDefinitions;
