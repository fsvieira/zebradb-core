var should = require("should");
var Z = require("../lib/z");


describe('Multiply Tests', function() {
    describe('Test Multiply results', function() {
        it('should multiply results.', function () {
            var z = new Z.Run(
                "(yellow 'a)" +
                "('b blue)"
            );
            
            should(
                Z.toString(z.query(
                    "('c 'd)"
                )
            )).eql(
                "(yellow 'a)\n" +
                "('b blue)\n" +
                "(yellow blue)"
            );
        });
        
        it('should multiply results (with variables with same name).', function () {
            var z = new Z.Run(
                "(yellow 'a)" +
                "('a blue)"
            );
            
            should(
                Z.toString(z.query(
                    "('a 'b)"
                )
            )).eql(
                "(yellow 'x$0)\n" +
                "('x$0 blue)\n" +
                "(yellow blue)"
            );
        });
    });
});