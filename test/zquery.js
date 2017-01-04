var should = require("should");
var Z = require("../lib3/z");

describe("ZQuery Tests.", function () {
    it("Query with single tuple constant.", function () {
        var run = new Z();
        
        run.add("(yellow)");
        should(run.print("?(yellow)")).eql("@(yellow)");
        should(run.print("?('q)")).eql("@(yellow)");
        
        should(new Z().print("(yellow) ?('q)")).eql("@(yellow)");
    });

    it('Should identify variables by name.', function () {
        var run = new Z();
        
        run.add("('p 'p)");
        should(run.print(
            "?(yellow 'p)"
        )).eql(
            "@(yellow yellow)"
        );

        run = new Z();
        run.add("('q ) (('q) ('q))");
        
        should(run.print(
            "?((yellow) ('p))"
        )).eql(
            "@(@(yellow) @(yellow))"
        );
    });

    it("Should unify variables with tuple values", function () {
        var run = new Z();
        
        run.add("(blue red yellow)");
        should(run.print(
            "?('a 'b 'c)"
        )).eql(
            "@(blue red yellow)"
        );
    });

    it("Should unify tuples variables.", function() {

        var run = new Z();
        
        run.add("('a 'a)");
        should(run.print(
            "?(yellow 'c)"
        )).eql(
            "@(yellow yellow)"
        );

        run = new Z();
        run.add("('x 'y) (('a 'a))");

        should(run.print(
            "?((yellow 'c))"
        )).eql(
            "@(@(yellow yellow))"
        );
        
        run = new Z();
        run.add("(yellow blue) (blue yellow) (('a 'b) ('b 'a))");
        
        should(run.print(
            "?((yellow 'c) (blue 'd))"
        )).eql(
            "@(@(yellow blue) @(blue yellow))"
        );
    });
});
