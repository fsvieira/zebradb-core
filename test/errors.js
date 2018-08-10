"use strict";

const test = require("../test-utils/test");

describe("Error Tests", () => {
	it("should give an error when definition doens\'t match.",
		test(
			"(definition (dont match with anything))", [{
				query: "?(definition ')",
				results: [
					`Invalid definition:
			                    (definition (dont match with anything)),
			                before query:
			                    (definition ')
			            `
				]
			}]
		)
	);
});
