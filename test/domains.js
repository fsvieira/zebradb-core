"use strict";

const test = require("../test-utils/test");

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
					"@(number {{v$37 : 0 1 2 3}})"
				]
			}]
		)
	);

	it("should make domain of two variables",
		test(
			`
			(number 0)
			(number 1)
			(number 2)
			(number 3)
			((number 'x) (number 'y))
			`, [{
				query: `?((number 'x) (number 'y))`,
				results: [
					"@(@(number {{v$48 : 0 1 2 3}}) @(number {{v$52 : 0 1 2 3}}))"
				]
			}]
		)
	);

});

