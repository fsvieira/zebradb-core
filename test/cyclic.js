"use strict";

const test = require("../test-utils/test");

describe("Cyclic Tests", function () {
	it("should handle cyclic data on multiply.",
		test(
			`
            (! 'q)
            ('p 'q 'p 'q)
            ('p 'q (! 'q) (! 'p))
            `,
            [{
                query: "(! 'q)",
                results: [
                    "@(! 'q)"
                ]
            }],
            {path: 'dbs/cyclic/1'}
		)
	);

	xit("should handle cyclic data on multiply (simple).",
		test(
			`
            ('p)
            ('p ('p))
            ('p 'p)
            `,
            [
                {
                    query: "(A 'p)",
                    results: [
                        "@(A @(A))",
                        "@(A A)"
                    ]
                },
                {
                    query: "('p (A))",
                    results: [
                        "@(@(A) @(A))",
                        "@(A @(A))"
                    ]
                },
                {
                    query: "(A A)",
                    results: [
                        "@(A A)"
                    ]
                },
                {
                    query: "('p 'p)",
                    results: [
                        "@('p 'p)"
                    ]
                },
                {
                    query: "('a 'b)",
                    results: [
                        "@('p 'p)",
                        "@('p @('p))"
                    ]
                }
            ],
            {path: 'dbs/cyclic/2'}
		)
	);

	xit("should handle cyclic data on query.",
		test(
			`
            (! 'q)
            ('p 'q 'p 'q)
            `,
            [
                {
        			// TODO: why is this empty ???
		    	    query: "('p 'q (! 'q) (! 'p))",
                    results: [
                        "<empty>"
                    ]
                },
                {
                    query: "(' ' (! A) (! A))",
                    results: [
                        "@(@(! A) @(! A) @(! A) @(! A))"
                    ]
                }
            ],
            {path: 'dbs/cyclic/3'}
		)
	);
});
