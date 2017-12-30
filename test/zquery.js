"use strict";

const test = require("../lib/testing/test");

describe("ZQuery Tests.", function () {
	it("Query with single tuple constant.",
		test(
			`(yellow)
            ?(yellow)`,

			`?(yellow):
                @(yellow)`
		)
	);

	it("Query with single tuple constant/variable.",
		test(
			`(yellow)
            ?(yellow)
            ?('q)`,

			`?(yellow):
                @(yellow)
            ?('q):
                @(yellow)
            `
		)
	);

	it("Should identify variables by name, simple tuple.",
		test(
			`('p 'p)
            ?(yellow 'p)`,

			`?(yellow 'p):
                @(yellow yellow)
            `
		)
	);

	it("Should identify variables by name, inner tuples.",
		test(
			`('q ) (('q) ('q))
            ?((yellow) ('p))`,

			`?((yellow) ('p)):
                @(@(yellow) @(yellow))`
		)
	);

	it("Should unify variables with tuple values.",
		test(
			`(blue red yellow)
            ?('a 'b 'c)`,

			`?('a 'b 'c):
                @(blue red yellow)
            `
		)
	);

	it("Should unify simple tuples variables.",
		test(
			`('a 'a)
            ?(yellow 'c)`,

			`?(yellow 'c):
                @(yellow yellow)
            `
		)
	);

	it("Should unify simple and inner tuples variables.",
		test(
			`('x 'y) (('a 'a))
            ?((yellow 'c))`,

			`?((yellow 'c)):
                @(@(yellow yellow))
            `
		)
	);

	it("Should unify inner tuples variables at same level.",
		test(
			`(yellow blue) (blue yellow) (('a 'b) ('b 'a))
            ?((yellow 'c) (blue 'd))`,

			`?((yellow 'c) (blue 'd)):
                @(@(yellow blue) @(blue yellow))
            `
		)
	);

	it("should handle duplicated definitions.",
		test(
			`('a) ('a) ?(yellow)`,

			`?(yellow):
                @(yellow)`
		)
	);
});
