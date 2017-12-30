"use strict";

const test = require("../lib/testing/test");

describe("Multiply Tests", function () {
	it("should multiply results.",
		test(
			`(yellow 'a)
            ('b blue)
            ?('c 'd)`,

			`?('c 'd):
                @('b blue)
                @(yellow 'a)
                @(yellow blue)`
		)
	);

	it("should multiply results (with variables with same name).",
		test(
			`(yellow 'a)
            ('a blue)
            ?('a 'b)`,

			`?('a 'b):
                @('a blue)
                @(yellow 'a)
                @(yellow blue)`
		)
	);
});
