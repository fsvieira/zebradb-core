"use strict";

const {test} = require("../");

describe("Error Tests", function () {
	it("should give an error when definition doens\'t match.",
		test(
			`
            (definition (dont match with anything))
            ?(definition ')`,

			`Errors:
                Invalid definition:
                    (definition (dont match with anything)),
                before query:
                    (definition ')
            `
		)
	);
});
