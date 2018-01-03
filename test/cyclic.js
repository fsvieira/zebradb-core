"use strict";

const test = require("../lib/testing/test");

xdescribe("Cyclic Tests", function () {
	it("should handle cyclic data on multiply.",
		test(
			`
            (! 'q)
            ('p 'q 'p 'q)
            ('p 'q (! 'q) (! 'p))
            ?(! 'q)`,

			`?(! 'q): @(! 'q)`
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

			`?(A 'p):
                @(A @(A))
                @(A A)

            ?('p (A)):
                @(@(A) @(A))
                @(A @(A))

            ?(A A):
                @(A A)

            ?('p 'p):
                @('p 'p)

            ?('a 'b):
                @('p 'p)
                @('p @('p))
            `
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

			// TODO: why is this empty ???
			`?('p 'q (! 'q) (! 'p)):
                <empty>
            ?(' ' (! A) (! A)):
                @(@(! A) @(! A) @(! A) @(! A))
            `
		)
	);
});
