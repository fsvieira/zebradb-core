var should = require("should");
var Z = require("../lib/z");

describe('ZQuery Tests.', function() {
    describe('Querys', function() {
        it('Query with single tuple constant.', function () {
            var run = new Z.Run([
                Z.t(Z.c("yellow"))
            ]);
            
            var query = function (q) {
                var r = run.query(q);
                return Z.toString(r);
            };

            should(
                query(
                    Z.t(Z.c("yellow"))
                )
            ).eql("(yellow)");

            should(
                query(
                    Z.t(Z.v("q"))
                )
            ).eql("(yellow)");
        });

        it('Should identify variables by name.', function () {
            var defs = [Z.t(Z.v("q"), Z.v("q"))];
            var run = new Z.Run(defs);
            var query = function (q) {
                return Z.toString(run.query(q));
            };
            
            should(defs).eql(
                [
                    {
                        data: [
                            { data: 'q', type: 'variable' },
                            { data: 'q', type: 'variable' }
                        ],
                        type: 'tuple'
                    }
                ]
            );

            should(query(
                    Z.t(Z.c("yellow"), Z.v("p"))
                )
            ).eql("(yellow yellow)");

            run = new Z.Run([ 
                Z.t(Z.v("q")), // ('q)
                Z.t( // (('q) ('q))
                    Z.t(Z.v("q")), 
                    Z.t(Z.v("q"))
                )
            ]);
            
            should(
                query(
                    Z.t(
                        Z.t(Z.c("yellow")),
                        Z.t(Z.v("p"))
                    )
                )
            ).eql("((yellow) (yellow))");
        });

        it("Should unify variables with tuple values", function () {
            var run = new Z.Run([ 
                Z.t(
                    Z.c("blue"),
                    Z.c("red"), 
                    Z.c("yellow")
                )
            ]);
            
            var query = function (q) {
                return Z.toString(run.query(q));
            };
            
            should(
                query(
                    Z.t(
                        Z.v("a"),
                        Z.v("b"), 
                        Z.v("c")
                    )
                )
            ).eql("(blue red yellow)");
        });

        it("Should unify tuples variables.", function () {
            
            var run = new Z.Run([ 
                Z.t(Z.v("a"), Z.v("a"))
            ]);
            
            var query = function (q) {
                return Z.toString(run.query(q));
            };

            should(
                query(
                    Z.t(Z.c("yellow"), Z.v("c")) 
                )
            ).eql("(yellow yellow)");

            run = new Z.Run([
                Z.t(Z.v("x"), Z.v("y")),
                Z.t(Z.t(Z.v("a"), Z.v("a"))) 
            ]);
            
            should(
                query(
                    Z.t(Z.t(Z.c("yellow"), Z.v("c")))
                )
            ).eql("((yellow yellow))");

            run = new Z.Run([
                Z.t(Z.c("yellow"), Z.c("blue")),
                Z.t(Z.c("blue"), Z.c("yellow")),
                Z.t(
                    Z.t(Z.v("a"), Z.v("b")), 
                    Z.t(Z.v("b"), Z.v("a"))
                )
            ]);

            should(
                query(
                    Z.t(
                        Z.t(Z.c("yellow"), Z.v("c")), 
                        Z.t(Z.c("blue"), Z.v("d"))
                    )
                )
            ).eql("((yellow blue) (blue yellow))");
        });
    });
});

