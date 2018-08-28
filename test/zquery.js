"use strict";

const test = require("../test-utils/test");

describe("ZQuery Tests.", () => {
	it("Query with single tuple constant.",
		test(
			"(yellow)", [{
				query: "?(yellow)",
				results: ["@(yellow)"]
			}]
		)
	);

	xit("Query with single tuple constant/variable.",
		test(
			"(yellow)", [{
					query: "?(yellow)",
					results: ["@(yellow)"]
				},
				{
					query: "?('q)",
					results: ["@(yellow)"]
				}
			]
		)
	);

	xit("Should identify variables by name, simple tuple.",
		test(
			"('p 'p)", [{
				query: "?(yellow 'p)",
				results: ["@(yellow yellow)"]
			}]
		)
	);

	xit("Should identify variables by name, inner tuples.",
		test(
			"('q ) (('q) ('q))", [{
				query: "?((yellow) ('p))",
				results: ["@(@(yellow) @(yellow))"]
			}]
		)
	);

	xit("Should unify variables with tuple values.",
		test(
			"(blue red yellow)", [{
				query: "?('a 'b 'c)",
				results: ["@(blue red yellow)"]
			}]
		)
	);

	xit("Should unify simple tuples variables.",
		test(
			"('a 'a)", [{
				query: "?(yellow 'c)",
				results: ["@(yellow yellow)"]
			}]
		)
	);

	xit("Should unify simple and inner tuples variables.",
		test(
			"('x 'y) (('a 'a))", [{
				query: "?((yellow 'c))",
				results: ["@(@(yellow yellow))"]
			}]
		)
	);

	xit("Should unify inner tuples variables at same level.",
		test(
			`(yellow blue)
			 (blue yellow)
			 (('a 'b) ('b 'a))
			`, [{
				query: "?((yellow 'c) (blue 'd))",
				results: ["@(@(yellow blue) @(blue yellow))"]
			}]
		)
	);

	xit("should handle duplicated definitions.",
		test(
			"('a) ('a)", [{
				query: "?(yellow)",
				results: ["@(yellow)"]
			}]
		)
	);
});
