"use strict";

const { parse: zparse } = require("./zparser");

function parse (action, text, destination, session) {
	let parsed;

	try {
		parsed = zparse(text);
	}
	catch (e) {
		// TODO: make kanban handle errors,
		// or handle errors on manager as a special value.
		throw "Exception (l=" + e.line + ", c=" + e.column + ") " + e.message;
	}

	session.postOffice.addActives(destination, parsed.length);

	for (var i=0; i<parsed.length; i++) {
		session.queue.put({
			action: "prepareDefinitions", 
			data: parsed[i],
			destination
		});
	}

	session.postOffice.subActives(destination, 1);
}

module.exports = parse;
