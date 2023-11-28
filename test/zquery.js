"use strict";

const test = require("../test-utils/test");

describe("ZQuery Tests.", () => {

	it("Query with single tuple constant.",
		test(
			"$YELLOW = {(yellow)}", [
				{
					query: "(yellow):$YELLOW",
					results: ["{@(yellow)}"]
				},
				/*{
					query: "(yellow)",
					results: ["@(yellow)"]
				}*/
			],
			{path: 'dbs/zquery/1', timeout: 1000 * 60 * 5}
		)
	);

	it("Query with single tuple constants.",
		test(
			"$COLORS = {(yellow) (blue)}", [
				{
					query: "('x):$COLORS",
					results: ["{@(blue) @(yellow)}"]
				},
				/*{
					query: "(yellow)",
					results: ["@(yellow)"]
				}*/
			],
			{path: 'dbs/zquery/2', timeout: 1000 * 60 * 5}
		)
	);

	xit("Query with single tuple constant/variable.",
		test(
			"(yellow)", [
				{
					query: "(yellow)",
					results: ["@(yellow)"]
				},
				{
					query: "('q)",
					results: ["@(yellow)"]
				}
			],
			{path: 'dbs/zquery/2'}
		)
	);

	xit("Should identify variables by name, simple tuple.",
		test(
			"('p 'p)", [{
				query: "(yellow 'p)",
				results: ["@(yellow yellow)"]
			}],
			{path: 'dbs/zquery/3'}
		)
	);

	xit("Should identify variables by name, inner tuples.",
		test(
			"('q ) (('q) ('q))", [{
				query: "((yellow) ('p))",
				results: ["@(@(yellow) @(yellow))"]
			}],
			{path: 'dbs/zquery/4'}
		)
	);

	xit("Should unify variables with tuple values.",
		test(
			"(blue red yellow)", [{
				query: "('a 'b 'c)",
				results: ["@(blue red yellow)"]
			}],
			{path: 'dbs/zquery/5'}
		)
	);

	xit("Should unify simple tuples variables.",
		test(
			"('a 'a)", [{
				query: "(yellow 'c)",
				results: ["@(yellow yellow)"]
			}],
			{path: 'dbs/zquery/6'}
		)
	);

	xit("Should unify simple and inner tuples variables.",
		test(
			"('x 'y) (('a 'a))", [{
				query: "((yellow 'c))",
				results: ["@(@(yellow yellow))"]
			}],
			{path: 'dbs/zquery/7'}
		)
	);

	xit("Should unify inner tuples variables at same level.",
		test(
			`(yellow blue)
			 (blue yellow)
			 (('a 'b) ('b 'a))
			`, [{
				query: "((yellow 'c) (blue 'd))",
				results: ["@(@(yellow blue) @(blue yellow))"]
			}],
			{path: 'dbs/zquery/8'}
		)
	);

	xit("should Quine not be able to complete, TODO: move this to infinity tests.",
		test(
			"('x = 'x) ('x)", [{
				query: "('x = ('x))",
				results: [] // it doesnt give solutions, because toString cant habdle loops ?
				// if x is checked it should stop since all x's will be checked!!
			}],
			{path: 'dbs/zquery/9.db', depth: 2}
		)
	);

	xit("should handle duplicated definitions.",
		test(
			"('a) ('a) ('b)", [{
				query: "(yellow)",
				results: ["@(yellow)"]
			}],
			{path: 'dbs/zquery/10.db'}
		)
	);
});
