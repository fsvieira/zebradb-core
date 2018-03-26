"use strict";

const test = require("../lib/testing/test");

describe("Test domain extraction.", () => {
	it("should be a easy domain",
		test(
            `
            (number 0)
            (number 1)
            (number 2)
            (number 3)
            `, [{
				query: `?(number 'a)`,
				results: [
					"@(number {{0 1 2 3}})"
				]
			}]
		)
	);
});

