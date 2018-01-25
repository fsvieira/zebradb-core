"use strict";

const prepare = require("../definitions/prepare");
const Match = require("../../../match/match");

function prepareQuery (req, res) {

	function genId () {
		return "id$" + req.store.id++;
	}

	const { query, definitions } = req.args;
	const { zvs, events } = req.context;
	const { functions } = req.store;

	// check that all functions are valid,
	for (let f in functions) {
		if (functions.hasOwnProperty(f)) {
			const valid = functions[f].validate();

			if (valid !== true) {
				// abort everything, send error.
				events.trigger(
					"error",
					"Invalid function: " + valid.funcname +
					", reason: " + valid.reason
				);

				res.send({});
				return;
			}
		}
	}

	const definitionsId = zvs.data.add(definitions);

	const definitionsBranchId = zvs.branches.getId({
		parent: zvs.branches.root,
		args: [definitionsId],
		action: "definitions"
	}).branchId;

	zvs.branches.transform(
		definitionsBranchId,
		zvs.data.global("definitions"),
		zvs.data.add({
			type: "definitions",
			data: {
				definitions,
				branchId: definitionsBranchId
			}
		})
	);

	const match = new Match(zvs);

	const definitionsIds = zvs.getData(definitionsBranchId, definitionsId);

	match.addTuples(definitionsIds);
	zvs.addDefinitionsMatch(definitionsBranchId, match);

	const preparedQuery = prepare.copyWithVars(query.data, genId);
	const queryId = zvs.data.add(preparedQuery);

	const { branchId: queryBranchId } = zvs.branches.getId({
		parent: definitionsBranchId,
		args: [queryId],
		action: "query",
		func: query.func
	});

	zvs.branches.transform(
		queryBranchId,
		zvs.data.global("queryBranchId"),
		zvs.data.add({
			type: "query",
			data: queryBranchId
		})
	);

	zvs.branches.transform(queryBranchId, zvs.data.global("query"), queryId);

	// events.trigger("query-start", {queryBranchId, trackIds: req.trackIds});

	/*
	res.send({
		value: {queryBranchId, definitionsBranchId},
		trackId: queryBranchId
	});
	*/
	res.send({ value: queryBranchId });
}

module.exports = prepareQuery;
