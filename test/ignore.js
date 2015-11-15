var should = require("should");
var Z = require("../lib/z");


describe('Ignore Tests', function() {
    describe('If ... then ... else', function() {
        it('should declare simple if then else.', function () {
            var run = new Z.Run(
                "(bool true)" +
                "(bool false)" +
                "(if (bool true) 'p _ 'p)" +
                "(if (bool false) _ 'p 'p)"
            );
            
            var query = function (q) {
                return Z.toString(run.query(q));
            };
            
            should(
                query(
                    "(if (bool true) (bool true) (bool false) 'r)"
                )
            ).eql(
                "(if (bool true) (bool true) _ (bool true))"
            );

            should(
                query(
                    "(if (bool false) (bool true) (bool false) 'r)"
                )
            ).eql(
                "(if (bool false) _ (bool false) (bool false))"
            );
        });

        it('should declare simple if then else (with recursive definitions).', function () {
            var run = new Z.Run(
                "(nat 0)" +
                "(nat (nat 'n))" +
                "(bool true)" +
                "(bool false)" +
                "(if (bool true) 'p _ 'p)" +
                "(if (bool false) _ 'p 'p)"
            );
            
            var query = function (q, len) {
                return Z.toString(run.query(q, len));
            };
            
            should(
                query(
                    "(if (bool true) (nat 0) (nat 'n) 'r)"
                )
            ).eql(
                "(if (bool true) (nat 0) _ (nat 0))\n(if (bool true) (nat 0) _ (nat 0))\n(if (bool true) (nat 0) _ (nat 0))"
            );

            should(
                query(
                    "(if (bool true) (nat 'n) (nat 0) 'r)",
                    17
                )
            ).eql(
                "(if (bool true) (nat 0) _ (nat 0))\n" +
                "(if (bool true) (nat (nat 0)) _ (nat (nat 0)))\n" +
                "(if (bool true) (nat (nat (nat 0))) _ (nat (nat (nat 0))))\n" +
                "(if (bool true) (nat (nat (nat (nat 0)))) _ (nat (nat (nat (nat 0)))))"
            );
        });
    });
});