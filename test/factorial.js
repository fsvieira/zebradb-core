var should = require("should");
var Z = require("../lib/z");
// var ZQuery = require("../lib/zquery_debug");
var ZQuery = require("../lib/zquery");


describe('Factorial Tests.', function() {
    describe('Natural Numbers', function() {
        it('Should declare ~Peanno numbers', function () {
            var run; 
            
            run = new ZQuery.Run(
                Z.d(
                    Z.t(Z.c("nat"), Z.c("0")),
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.v("n")))
                )
            );
            
            
            should(run.queryArray (
                Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("1")))
            )).eql([]);

            should(run.queryArray (
                Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0")))
            )).eql(["(nat (nat 0))"]);

            should(run.queryArray(
                Z.t(Z.c("nat"), Z.v("n")),
                10
            )).eql([
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
            var run;
            
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
            should(run.queryArray (
                Z.t(
                    Z.c("add"),
                    Z.t(Z.c("nat"), Z.c("0")), // 0
                    Z.t(Z.c("nat"), Z.c("0")), // 0
                    Z.v("r"),
                    Z.v()
                )
            )).eql(["(add (nat 0) (nat 0) 'r = (nat 'a = 0) ')" ]);
            
            // 1 + 0 = 1
            should(run.queryArray (
                Z.t(
                    Z.c("add"),
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0"))), // 1
                    Z.t(Z.c("nat"), Z.c("0")), // 0
                    Z.v("r"),
                    Z.v()
                )
            )).eql(["(add (nat (nat 0)) (nat 0) 'r = (nat 'a = (nat 0)) ')"]);
            
            // 0 + 1 = 1
            should(run.queryArray (
                Z.t(
                    Z.c("add"),
                    Z.t(Z.c("nat"), Z.c("0")), // 0
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0"))), // 1
                    Z.v("r"),
                    Z.v()
                )
            )).eql(["(add (nat 0) (nat (nat 0)) 'r = (nat 'r = (nat 'a = 0)) ' = (add (nat 'a = 0) (nat 'b = 0) 'r = (nat 'a = 0) '))"]);
        });
        
        it('Should declare a factorial func', function () {
            var run;
            
            run = new ZQuery.Run(
                Z.d(
                    Z.t(Z.c("nat"), Z.c("0")),
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.v("n"))),
                    
                    Z.t(
                        Z.c("fac"),
                        Z.t(Z.c("nat"), Z.c("0")), // 0
                        Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0"))), // 1
                        Z.v()
                    ), 
                    
                    // 0! = 1.
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
                    
                    // TODO: mul is missing.
                    //, Z.t(Z.v(), Z.v())
                )
            );
            
            // fac(0) = 1
            should(run.queryArray(
                Z.t(
                    Z.c("fac"),
                    Z.t(Z.c("nat"), Z.c("0")), // 0
                    Z.v("r"),
                    Z.v()
                )
            )).eql(["(fac (nat 0) 'r = (nat (nat 0)) ')"]);
            
            
            // fac(1) = 1
            /*should(run.queryArray(
                Z.t(
                    Z.c("fac"),
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0"))), // 3
                    Z.v("r"),
                    Z.v()
                )
            )).eql([]);*/

           // console.log(ZQuery.Run.logger.toString());

        });
    });
});