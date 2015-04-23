var should = require("should");
var Z = require("../lib/z");
var ZQuery = require("../lib/zquery");


describe('Factorial Tests.', function() {
    describe('Natural Numbers', function() {
        it('Should declare ~Peanno numbers', function () {
            var run, result;
            
            run = new ZQuery.Run(
                Z.d(
                    Z.t(Z.c("nat"), Z.c("0")),
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.v("n")))
                )
            );
            
            result = [];
            run.query (
                Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("1"))),
                function (q) {
                    result.push(q.toString());
                }
            );
            should(result.length).equal(0);
            
            result = [];
            run.query (
                Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0"))),
                function (q) {
                    result.push(q.toString());
                }
            );
            should(result).eql(["(nat (nat 0))"]);

            should(function () {
                var results = []; 
                try {
                    run.query(
                        Z.t(Z.c("nat"), Z.v("n")),
                        function (q) {
                            results.push(q.toString());
                            if (results.length >= 10) {
                                throw "Enough Results";
                            }
                        }
                    );
                } catch (e) {
                    if (e !== "Enough Results") {
                        throw e;
                    }
                }
                
                return results;
            }()).eql ([
                "(nat 'n = 0)",
                "(nat 'n = (nat 'n = 0))",
                "(nat 'n = (nat 'n = (nat 'n = 0)))",
                "(nat 'n = (nat 'n = (nat 'n = (nat 'n = 0))))",
                "(nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = 0)))))",
                "(nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = 0))))))",
                "(nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = 0)))))))",
                "(nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = 0))))))))",
                "(nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = 0)))))))))",
                "(nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = 0))))))))))"
            ]);
        });
        
        it('Should declare a add func', function () {
            var run, result;
            
            run = new ZQuery.Run(
                Z.d(
                    Z.t(Z.c("nat"), Z.c("0")),
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.v("n"))),
    
                    // a . 0 = a,                
                    Z.t(
                        Z.c("add"),
                        Z.t(Z.c("nat"), Z.v("a")),  // a 
                        Z.t(Z.c("nat"), Z.c("0")), // 0
                        Z.t(Z.c("nat"), Z.v("a")), // a + 0 = a
                        Z.v()
                    )
                    
                    // a . S(b) = a + (a . b)
                    , Z.t(
                        Z.c("add"),
                        Z.t(Z.c("nat"), Z.v("a")),  // a 
                        Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.v("b"))), // b
                        Z.t(Z.c("nat"), Z.v("r")), // r = a + 1 + r
                        Z.t(
                            Z.c("add"), 
                            Z.t(Z.c("nat"), Z.v("a")),
                            Z.t(Z.c("nat"), Z.v("b")),
                            Z.v("r"),
                            Z.v()
                        )
                    )
                )
            );
            
            // 0 + 0 = 0
            run.query (
                Z.t(
                    Z.c("add"),
                    Z.t(Z.c("nat"), Z.c("0")), // 0
                    Z.t(Z.c("nat"), Z.c("0")), // 0
                    Z.v("r"),
                    Z.v()
                ),
                function (q) {
                    console.log("[1] " + q.toString());
                }
            );
            
            // 1 + 0 = 1
            run.query (
                Z.t(
                    Z.c("add"),
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0"))), // 1
                    Z.t(Z.c("nat"), Z.c("0")), // 0
                    Z.v("r"),
                    Z.v()
                ),
                function (q) {
                    console.log("[2] " + q.toString());
                }
            );
            
            // 0 + 1 = 1
            /*run.query (
                Z.t(
                    Z.c("add"),
                    Z.t(Z.c("nat"), Z.c("0")), // 0
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0"))), // 1
                    Z.v("r"),
                    Z.v()
                ),
                function (q) {
                    console.log("[3] " + q.toString());
                }
            );*/
        });
        
        /*it('Should declare a factorial func', function () {
            var run, result;
            
            run = new ZQuery.Run(
                Z.d(
                    Z.t(Z.c("nat"), Z.c("0")),
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.v("n"))),
                    
                    Z.t(
                        Z.c("fac"),
                        Z.t(Z.c("nat"), Z.c("0")), // 0
                        Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.v("0"))), // 1
                        Z.v()
                    ), // 0! = 1.
                    Z.t(
                        Z.c("fac"), 
                        Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.v("k"))), // > 0
                        Z.v("n"), 
                        Z.t(
                            Z.t(
                                Z.c("fac"), 
                                Z.t(Z.c("nat"), Z.v("k")),
                                Z.v("n1"),
                                Z.v()
                            ),
                            Z.t(Z.c("mul"), 
                                Z.v("n1"),
                                Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.v("k"))),
                                Z.v("n"),
                                Z.v()
                            )
                        )
                    )
                )
            );
        });*/
    });
});