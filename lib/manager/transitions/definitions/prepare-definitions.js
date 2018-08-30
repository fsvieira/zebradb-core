"use strict";

const prepare = require("./prepare");

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
