"use strict";

const prepare = require("./prepare");

/*
function prepareDefinitions (req, res) {

	function genId () {
		return "id$" + req.store.id++;
	}

	const definitions = req.store.definitions;
	const tuple = req.args;

	if (tuple.type === "query") {
		res.send({
			value: {
				definitions,
				query: tuple
			}
		});
	}
	else {
		const def = prepare.copyWithVars(tuple, genId);
		def.check = true;

		definitions.push(def);
		req.store.definitionsBranchId = undefined;
		res.send({});
	}
}
*/

function prepareDefinitions (action, data, destination, session) {

	function genId () {
		return "id$" + session.store.id++;
	}

	const definitions = session.store.definitions;
	const tuple = data;

	if (tuple.type === "query") {
		session.postOffice.addActives(destination, 1);

		session.queue.put({
			action: "checkDefinitions",
			data: {
				definitions,
				query: tuple
			},
			destination
		});

		session.postOffice.subActives(destination, 1);
	}
	else {
		const def = prepare.copyWithVars(tuple, genId);
		def.check = true;

		definitions.push(def);
		session.store.definitionsBranchId = undefined;

		// TODO: save all definitions on zvs.
	}
}

module.exports = prepareDefinitions;
