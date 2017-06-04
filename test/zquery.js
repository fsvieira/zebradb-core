const should = require("should");
const Z = require("../lib/z");
const test = require("../lib/testing/test");

describe("ZQuery Tests.", function () {
    it("Query with single tuple constant.",
        test(
            "(yellow)" +
            "?(yellow)" +
            "?('q)",
            // results,
            "?(yellow):\n" +
                "\t@(yellow)\n" +
            "?('q):\n" +
                "\t@(yellow)"
        )
    );

    it('Should identify variables by name, simple tuple.',
        test(
            "('p 'p)" +
            "?(yellow 'p)",
            "?(yellow 'p):\n" +
                "\t@(yellow yellow)"
        )
    );

    it('Should identify variables by name, inner tuples.',
        test(
            "('q ) (('q) ('q))" +
            "?((yellow) ('p))",
            "?((yellow) ('p)):\n" +
                "\t@(@(yellow) @(yellow))"
        )
    );

    it('Should unify variables with tuple values.',
        test(
            "(blue red yellow)" +
            "?('a 'b 'c)",
            "?('a 'b 'c):\n" +
                "\t@(blue red yellow)"
        )
    );

    it('Should unify simple tuples variables.',
        test(
            "('a 'a)" +
            "?(yellow 'c)",
            "?(yellow 'c):\n" +
                "\t@(yellow yellow)"
        )
    );

    it('Should unify simple and inner tuples variables.',
        test(
            "('x 'y) (('a 'a))" +
            "?((yellow 'c))",
            "?((yellow 'c)):\n" +
                "\t@(@(yellow yellow))"
        )
    );

    it('Should unify inner tuples variables at same level.',
        test(
            "(yellow blue) (blue yellow) (('a 'b) ('b 'a))" +
            "?((yellow 'c) (blue 'd))",
            "?((yellow 'c) (blue 'd)):\n" +
                "\t@(@(yellow blue) @(blue yellow))"
        )
    );

    it("should handle duplicated definitions.", 
        test(
            "('a) ('a) ?(yellow)",
            "?(yellow):\n" +
                "\t@(yellow)"
        )
    );
});
