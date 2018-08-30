"use strict";

const test = require("../test-utils/test");

xdescribe("Cyclic Tests", function () {
	it("should handle cyclic data on multiply.",
		test(
			`
            (! 'q)
            ('p 'q 'p 'q)
            ('p 'q (! 'q) (! 'p))
            ?(! 'q)`,
            [{
                query: "?(! 'q)",
                results: [
                    "@(! 'q)"
                ]
            }]
		)
	);

	it("should handle cyclic data on multiply (simple).",
		test(
			`
            ('p)
            ('p ('p))
            ('p 'p)
            ?(A 'p)
            ?('p (A))
            ?(A A)
            ?('p 'p)
            ?('a 'b)`,
            [
                {
                    query: "?(A 'p)",
                    results: [
                        "@(A @(A))",
                        "@(A A)"
                    ]
                },
                {
                    query: "?('p (A))",
                    results: [
                        "@(@(A) @(A))",
                        "@(A @(A))"
                    ]
                },
                {
                    query: "?(A A)",
                    results: [
                        "@(A A)"
                    ]
                },
                {
                    query: "?('p 'p)",
                    results: [
                        "@('p 'p)"
                    ]
                },
                {
                    query: "?('a 'b)",
                    results: [
                        "@('p 'p)",
                        "@('p @('p))"
                    ]
                }
            ]
		)
	);

	it("should handle cyclic data on query.",
		test(
			`
            (! 'q)
            ('p 'q 'p 'q)
            ?('p 'q (! 'q) (! 'p))
            ?(' ' (! A) (! A))
            `,
            [
                {
        			// TODO: why is this empty ???
		    	    query: "?('p 'q (! 'q) (! 'p))",
                    results: [
                        "<empty>"
                    ]
                },
                {
                    query: "?(' ' (! A) (! A))",
                    results: [
                        "@(@(! A) @(! A) @(! A) @(! A))"
                    ]
                }
            ]
		)
	);
});
