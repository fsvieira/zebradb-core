var should = require("should");
var Z = require("../lib/z");


describe('Multiply Tests', function() {
    describe('Test Multiply results', function() {
        it('should multiply results.', function () {
            var run = new Z();
            
            run.add(
                "(yellow 'a)" +
                "('b blue)"
            );
            
            should(
                run.print(
                    "?('c 'd)"
                )
            ).eql(
                "@('b blue)\n" +
                "@(yellow 'a)\n" +
                "@(yellow blue)"
            );
        });
        
        it('should multiply results (with variables with same name).', function () {
            
            var run = new Z();
            
            run.add(
                "(yellow 'a)" +
                "('a blue)"
            );
            
            should(
                run.print(
                    "?('a 'b)"
                )
            ).eql(
                "@('a blue)\n" +
                "@(yellow 'a)\n" +
                "@(yellow blue)"
            );
        });
    });
});