"use strict";

const { parse: zparse } = require("./zparser");
const prepare = require("./prepare");

function parse (text) {
	let parsed;

	try {
		parsed = zparse(text);
	}
	catch (e) {
		console.log(e);
		throw "Exception (l=" + e.location.start.line + ", c=" + e.location.start.column + ") " + e.message;
	}

	const result = [];

	for (var i=0; i<parsed.length; i++) {
		console.log(
			"\nPARSED: ", JSON.stringify(parsed[i], null, '  ')
		);

		const p = prepare(parsed[i]);

		console.log(
			"\nPARSED: ", JSON.stringify(parsed[i], null, '  '), 
			"\nPREPARED: ", JSON.stringify(p, null, '  ')
		);

		result.push(p);
	}

	return result;
}


module.exports = parse;
