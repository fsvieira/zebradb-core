var should = require("should");
var Z = require("../lib/z");
var ZQuery = require("../lib/zquery");
var D = require("../lib/zquery_debug");

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
                undefined,
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
                    ),
                    
                    // a . S(b) = a + (a . b)
                    Z.t(
                        Z.c("add"),
                        Z.t(Z.c("nat"), Z.v("a")),  // a 
                        Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.v("b"))), // S(b)
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
            
            // 2 + 3 = 5
            should(run.queryArray (
                Z.t(
                    Z.c("add"),
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0")))), // 2
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0"))))), // 3
                    Z.v("r"),
                    Z.v()
                )
            )).eql(["(add (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0)))))) ' = (add (nat 'a = (nat (nat 0))) (nat 'b = (nat (nat 0))) 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0))))) ' = (add (nat 'a = (nat (nat 0))) (nat 'b = (nat 0)) 'r = (nat 'r = (nat 'a = (nat (nat 0)))) ' = (add (nat 'a = (nat (nat 0))) (nat 'b = 0) 'r = (nat 'a = (nat (nat 0))) '))))"]);

            // 3 + 2 = 5
            should(run.queryArray (
                Z.t(
                    Z.c("add"),
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0"))))), // 3
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0")))), // 2
                    Z.v("r"),
                    Z.v()
                )
            )).eql(["(add (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat (nat 0)))))) ' = (add (nat 'a = (nat (nat (nat 0)))) (nat 'b = (nat 0)) 'r = (nat 'r = (nat 'a = (nat (nat (nat 0))))) ' = (add (nat 'a = (nat (nat (nat 0)))) (nat 'b = 0) 'r = (nat 'a = (nat (nat (nat 0)))) ')))"]);

            // 2 + 2 = 4
            should(run.queryArray (
                Z.t(
                    Z.c("add"),
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0")))), // 2
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0")))), // 2
                    Z.v("r"),
                    Z.v()
                )
            )).eql(["(add (nat (nat (nat 0))) (nat (nat (nat 0))) 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0))))) ' = (add (nat 'a = (nat (nat 0))) (nat 'b = (nat 0)) 'r = (nat 'r = (nat 'a = (nat (nat 0)))) ' = (add (nat 'a = (nat (nat 0))) (nat 'b = 0) 'r = (nat 'a = (nat (nat 0))) ')))"]);

        });
          
        
        it('Should declare a list', function () {
            var run;
            
            run = new ZQuery.Run(Z.d(
                Z.t(Z.c("list")), // empty list,
                Z.t(Z.c("list"), Z.v("item"), Z.t(Z.c("list"), Z.v(), Z.v())),
                Z.t(Z.c("list"), Z.v("item"), Z.t(Z.c("list"))),
                
                Z.t(Z.c("fruit"), Z.c("banana")),
                Z.t(Z.c("fruit"), Z.c("strawberry")),
                Z.t(Z.c("fruit"), Z.c("apple")),
                Z.t(Z.c("fruit"), Z.c("papaya"))
            ));

            should(run.queryArray(Z.t(Z.c("list")))).eql(["(list)"]);

            should(run.queryArray(
                Z.t(
                    Z.c("list"), Z.t(Z.c("fruit"), Z.c("banana")), 
                    Z.t(Z.c("list"), Z.t(Z.c("fruit"), Z.c("apple")), 
                        Z.t(Z.c("list"))
                    )
                )
            )).eql(["(list (fruit banana) (list (fruit apple) (list)))"]);

            should(run.queryArray(
                Z.t(
                    Z.c("list"), Z.t(Z.c("fruit"), Z.v("p")),
                    Z.t(Z.c("list"), Z.t(Z.c("fruit"), Z.n(Z.v("p"))),
                        Z.t(Z.c("list"))
                    )
                )
            )).eql([
                "(list (fruit 'p = strawberry) (list (fruit ' = banana) (list)))",
                "(list (fruit 'p = apple) (list (fruit ' = banana) (list)))",
                "(list (fruit 'p = papaya) (list (fruit ' = banana) (list)))",
                "(list (fruit 'p = banana) (list (fruit ' = strawberry) (list)))",
                "(list (fruit 'p = apple) (list (fruit ' = strawberry) (list)))",
                "(list (fruit 'p = papaya) (list (fruit ' = strawberry) (list)))",
                "(list (fruit 'p = banana) (list (fruit ' = apple) (list)))",
                "(list (fruit 'p = strawberry) (list (fruit ' = apple) (list)))",
                "(list (fruit 'p = papaya) (list (fruit ' = apple) (list)))",
                "(list (fruit 'p = banana) (list (fruit ' = papaya) (list)))",
                "(list (fruit 'p = strawberry) (list (fruit ' = papaya) (list)))",
                "(list (fruit 'p = apple) (list (fruit ' = papaya) (list)))"    
            ]);
        });
        
        it('Should declare a mul func', function () {
            var run;
            
            run = new ZQuery.Run(
                Z.d(
                    Z.t(Z.c("nat"), Z.c("0")),
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.v("n"))),
    
                    // a . 0 = a,                
                    Z.t(
                        Z.c("add"),
                        Z.t(Z.c("nat"), Z.v("a")), // a 
                        Z.t(Z.c("nat"), Z.c("0")), // 0
                        Z.t(Z.c("nat"), Z.v("a")), // a + 0 = a
                        Z.v()
                    ),
                    
                    // a . S(b) = a + (a . b)
                    Z.t(
                        Z.c("add"),
                        Z.t(Z.c("nat"), Z.v("a")), // a 
                        Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.v("b"))), // S(b)
                        Z.t(Z.c("nat"), Z.v("r")), // r = a + 1 + r
                        Z.t(
                            Z.c("add"), 
                            Z.t(Z.c("nat"), Z.v("a")),
                            Z.t(Z.c("nat"), Z.v("b")),
                            Z.v("r"),
                            Z.v()
                        )
                    ),

                    // List
                    Z.t(Z.c("list")), // empty list,
                    Z.t(Z.c("list"), Z.v("item"), Z.t(Z.c("list"), Z.v(), Z.v())),
                    Z.t(Z.c("list"), Z.v("item"), Z.t(Z.c("list"))),
                    
                    // a . 0 = 0
                    Z.t(
                        Z.c("mul"),
                        Z.t(Z.c("nat"), Z.v("a")), // a 
                        Z.t(Z.c("nat"), Z.c("0")), // 0
                        Z.t(Z.c("nat"), Z.c("0")), // 0
                        Z.v()
                    ),
                    
                    // a . S(b) = a + (a . b)
                    Z.t(
                        Z.c("mul"),
                        Z.t(Z.c("nat"), Z.v("a")),  // a 
                        Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.v("b"))), // S(b)
                        Z.v("r"), // r
                        Z.t(
                            Z.c("list"),
                            Z.t(
                                Z.c("add"),
                                Z.t(Z.c("nat"), Z.v("a")),
                                Z.v("rm"),
                                Z.v("r"),
                                Z.v()
                            ),
                            Z.t(
                                Z.c("list"),
                                Z.t(
                                    Z.c("mul"),
                                    Z.t(Z.c("nat"), Z.v("a")), // a
                                    Z.t(Z.c("nat"), Z.v("b")), // b
                                    Z.v("rm"),
                                    Z.v()
                                ),
                                Z.t(Z.c("list"))
                            )
                        )
                    )
                )
            );

            // 0 * 0 = 0
            should(run.queryArray(
                Z.t(
                    Z.c("mul"),
                    Z.t(Z.c("nat"), Z.c("0")), // 0
                    Z.t(Z.c("nat"), Z.c("0")), // 0
                    Z.v("r"), // r
                    Z.v()
                )
            )).eql(["(mul (nat 0) (nat 0) 'r = (nat 0) ')"]);

            
            // 1 * 0 = 0
            should(run.queryArray(
                Z.t(
                    Z.c("mul"),
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0"))), // 1
                    Z.t(Z.c("nat"), Z.c("0")), // 0
                    Z.v("r"), // r
                    Z.v()
                )
            )).eql(["(mul (nat (nat 0)) (nat 0) 'r = (nat 0) ')"]);
            
            // 0 * 1 = 0
            should(run.queryArray(
                Z.t(
                    Z.c("mul"),
                    Z.t(Z.c("nat"), Z.c("0")), // 0
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0"))), // 1
                    Z.v("r"), // r
                    Z.v()
                )
            )).eql(["(mul (nat 0) (nat (nat 0)) 'r = (nat 'a = 0) ' = (list (add (nat 'a = 0) 'rm = (nat 0) 'r = (nat 'a = 0) ') (list (mul (nat 'a = 0) (nat 'b = 0) 'rm = (nat 0) ') (list))))"]);

            // 1 * 1 = 1
            should(run.queryArray(
                Z.t(
                    Z.c("mul"),
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0"))), // 1
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0"))), // 1
                    Z.v("r"), // r
                    Z.v()
                )
            )).eql(["(mul (nat (nat 0)) (nat (nat 0)) 'r = (nat 'a = (nat 0)) ' = (list (add (nat 'a = (nat 0)) 'rm = (nat 0) 'r = (nat 'a = (nat 0)) ') (list (mul (nat 'a = (nat 0)) (nat 'b = 0) 'rm = (nat 0) ') (list))))"]);
            
            // 2 * 1 = 1
            should(run.queryArray(
                Z.t(
                    Z.c("mul"),
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0")))), // 2
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0"))), // 1
                    Z.v("r"), // r
                    Z.v()
                )
            )).eql(["(mul (nat (nat (nat 0))) (nat (nat 0)) 'r = (nat 'a = (nat (nat 0))) ' = (list (add (nat 'a = (nat (nat 0))) 'rm = (nat 0) 'r = (nat 'a = (nat (nat 0))) ') (list (mul (nat 'a = (nat (nat 0))) (nat 'b = 0) 'rm = (nat 0) ') (list))))"]);

            // 1 * 2 = 2
            should(run.queryArray(
                Z.t(
                    Z.c("mul"),
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0"))), // 1
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0")))), // 2
                    Z.v("r"), // r
                    Z.v()
                )
            )).eql(["(mul (nat (nat 0)) (nat (nat (nat 0))) 'r = (nat 'r = (nat 'a = (nat 0))) ' = (list (add (nat 'a = (nat 0)) 'rm = (nat 'a = (nat 0)) 'r = (nat 'r = (nat 'a = (nat 0))) ' = (add (nat 'a = (nat 0)) (nat 'b = 0) 'r = (nat 'a = (nat 0)) ')) (list (mul (nat 'a = (nat 0)) (nat 'b = (nat 0)) 'rm = (nat 'a = (nat 0)) ' = (list (add (nat 'a = (nat 0)) 'rm = (nat 0) 'r = (nat 'a = (nat 0)) ') (list (mul (nat 'a = (nat 0)) (nat 'b = 0) 'rm = (nat 0) ') (list)))) (list))))"]);

            // 2 * 2
            should(run.queryArray(
                Z.t(
                    Z.c("mul"),
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0")))), // 2
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0")))), // 2
                    Z.v("r"), // r
                    Z.v()
                )
            )).eql(["(mul (nat (nat (nat 0))) (nat (nat (nat 0))) 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0))))) ' = (list (add (nat 'a = (nat (nat 0))) 'rm = (nat 'a = (nat (nat 0))) 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0))))) ' = (add (nat 'a = (nat (nat 0))) (nat 'b = (nat 0)) 'r = (nat 'r = (nat 'a = (nat (nat 0)))) ' = (add (nat 'a = (nat (nat 0))) (nat 'b = 0) 'r = (nat 'a = (nat (nat 0))) '))) (list (mul (nat 'a = (nat (nat 0))) (nat 'b = (nat 0)) 'rm = (nat 'a = (nat (nat 0))) ' = (list (add (nat 'a = (nat (nat 0))) 'rm = (nat 0) 'r = (nat 'a = (nat (nat 0))) ') (list (mul (nat 'a = (nat (nat 0))) (nat 'b = 0) 'rm = (nat 0) ') (list)))) (list))))"]);

            // 2 * 3 = 6
            should(run.queryArray(
                Z.t(
                    Z.c("mul"),
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0")))), // 2
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0"))))), // 3
                    Z.v("r"), // r
                    Z.v()
                )
            )).eql(["(mul (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0))))))) ' = (list (add (nat 'a = (nat (nat 0))) 'rm = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0))))) 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0))))))) ' = (add (nat 'a = (nat (nat 0))) (nat 'b = (nat 'a = (nat (nat 0)))) 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0)))))) ' = (add (nat 'a = (nat (nat 0))) (nat 'b = (nat (nat 0))) 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0))))) ' = (add (nat 'a = (nat (nat 0))) (nat 'b = (nat 0)) 'r = (nat 'r = (nat 'a = (nat (nat 0)))) ' = (add (nat 'a = (nat (nat 0))) (nat 'b = 0) 'r = (nat 'a = (nat (nat 0))) '))))) (list (mul (nat 'a = (nat (nat 0))) (nat 'b = (nat (nat 0))) 'rm = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0))))) ' = (list (add (nat 'a = (nat (nat 0))) 'rm = (nat 'a = (nat (nat 0))) 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0))))) ' = (add (nat 'a = (nat (nat 0))) (nat 'b = (nat 0)) 'r = (nat 'r = (nat 'a = (nat (nat 0)))) ' = (add (nat 'a = (nat (nat 0))) (nat 'b = 0) 'r = (nat 'a = (nat (nat 0))) '))) (list (mul (nat 'a = (nat (nat 0))) (nat 'b = (nat 0)) 'rm = (nat 'a = (nat (nat 0))) ' = (list (add (nat 'a = (nat (nat 0))) 'rm = (nat 0) 'r = (nat 'a = (nat (nat 0))) ') (list (mul (nat 'a = (nat (nat 0))) (nat 'b = 0) 'rm = (nat 0) ') (list)))) (list)))) (list))))"]);
            
            // 3 * 2 = 6
            should(run.queryArray(
                Z.t(
                    Z.c("mul"),
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0"))))), // 3
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0")))), // 2
                    Z.v("r"), // r
                    Z.v()
                )
            )).eql(["(mul (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat (nat 0))))))) ' = (list (add (nat 'a = (nat (nat (nat 0)))) 'rm = (nat 'a = (nat (nat (nat 0)))) 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat (nat 0))))))) ' = (add (nat 'a = (nat (nat (nat 0)))) (nat 'b = (nat (nat 0))) 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat (nat 0)))))) ' = (add (nat 'a = (nat (nat (nat 0)))) (nat 'b = (nat 0)) 'r = (nat 'r = (nat 'a = (nat (nat (nat 0))))) ' = (add (nat 'a = (nat (nat (nat 0)))) (nat 'b = 0) 'r = (nat 'a = (nat (nat (nat 0)))) ')))) (list (mul (nat 'a = (nat (nat (nat 0)))) (nat 'b = (nat 0)) 'rm = (nat 'a = (nat (nat (nat 0)))) ' = (list (add (nat 'a = (nat (nat (nat 0)))) 'rm = (nat 0) 'r = (nat 'a = (nat (nat (nat 0)))) ') (list (mul (nat 'a = (nat (nat (nat 0)))) (nat 'b = 0) 'rm = (nat 0) ') (list)))) (list))))"]);
        });
        
        it('Should declare a factorial func', function () {
            var run;
            
            run = new ZQuery.Run(
                Z.d(
                    Z.t(Z.c("nat"), Z.c("0")),
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.v("n"))),
    
                    // a . 0 = a,                
                    Z.t(
                        Z.c("add"),
                        Z.t(Z.c("nat"), Z.v("a")), // a 
                        Z.t(Z.c("nat"), Z.c("0")), // 0
                        Z.t(Z.c("nat"), Z.v("a")), // a + 0 = a
                        Z.v()
                    ),
                    
                    // a . S(b) = a + (a . b)
                    Z.t(
                        Z.c("add"),
                        Z.t(Z.c("nat"), Z.v("a")), // a 
                        Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.v("b"))), // S(b)
                        Z.t(Z.c("nat"), Z.v("r")), // r = a + 1 + r
                        Z.t(
                            Z.c("add"), 
                            Z.t(Z.c("nat"), Z.v("a")),
                            Z.t(Z.c("nat"), Z.v("b")),
                            Z.v("r"),
                            Z.v()
                        )
                    ),

                    // List
                    Z.t(Z.c("list")), // empty list,
                    Z.t(Z.c("list"), Z.v("item"), Z.t(Z.c("list"), Z.v(), Z.v())),
                    Z.t(Z.c("list"), Z.v("item"), Z.t(Z.c("list"))),
                    
                    // a . 0 = 0
                    Z.t(
                        Z.c("mul"),
                        Z.t(Z.c("nat"), Z.v("a")), // a 
                        Z.t(Z.c("nat"), Z.c("0")), // 0
                        Z.t(Z.c("nat"), Z.c("0")), // 0
                        Z.v()
                    ),
                    
                    // a . S(b) = a + (a . b)
                    Z.t(
                        Z.c("mul"),
                        Z.t(Z.c("nat"), Z.v("a")),  // a 
                        Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.v("b"))), // S(b)
                        Z.v("r"), // r
                        Z.t(
                            Z.c("list"),
                            Z.t(
                                Z.c("add"),
                                Z.t(Z.c("nat"), Z.v("a")),
                                Z.v("rm"),
                                Z.v("r"),
                                Z.v()
                            ),
                            Z.t(
                                Z.c("list"),
                                Z.t(
                                    Z.c("mul"),
                                    Z.t(Z.c("nat"), Z.v("a")), // a
                                    Z.t(Z.c("nat"), Z.v("b")), // b
                                    Z.v("rm"),
                                    Z.v()
                                ),
                                Z.t(Z.c("list"))
                            )
                        )
                    ),

                    // 0! = 1.                    
                    Z.t(
                        Z.c("fac"),
                        Z.t(Z.c("nat"), Z.c("0")), // 0
                        Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0"))), // 1
                        Z.v()
                    ), 
                    
                    Z.t(
                        Z.c("fac"), 
                        Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.v("k"))), // > 0
                        Z.v("n"), 
                        Z.t(
                            Z.c("list"),
                            Z.t(
                                Z.c("mul"), 
                                Z.v("n1"),
                                Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.v("k"))),
                                Z.v("n"),
                                Z.v()
                            ),                            
                            Z.t(
                                Z.c("list"),
                                Z.t(
                                    Z.c("fac"), 
                                    Z.t(Z.c("nat"), Z.v("k")),
                                    Z.v("n1"),
                                    Z.v()
                                ),
                                Z.t(Z.c("list"))
                            )
                        )
                    )
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
            should(run.queryArray(
                Z.t(
                    Z.c("fac"),
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0"))), // 1
                    Z.v("r"),
                    Z.v()
                )
            )).eql(["(fac (nat (nat 0)) 'r = (nat 'a = (nat 0)) ' = (list (mul 'n1 = (nat (nat 0)) (nat (nat 'k = 0)) 'n = (nat 'a = (nat 0)) ' = (list (add (nat 'a = (nat 0)) 'rm = (nat 0) 'r = (nat 'a = (nat 0)) ') (list (mul (nat 'a = (nat 0)) (nat 'b = 0) 'rm = (nat 0) ') (list)))) (list (fac (nat 'k = 0) 'n1 = (nat (nat 0)) ') (list))))"]);

            // fac(2) = 2
            should(run.queryArray(
                Z.t(
                    Z.c("fac"),
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0")))), // 2
                    Z.v("r"),
                    Z.v()
                )
            )).eql(["(fac (nat (nat (nat 0))) 'r = (nat 'r = (nat 'a = (nat 0))) ' = (list (mul 'n1 = (nat 'a = (nat 0)) (nat (nat 'k = (nat 0))) 'n = (nat 'r = (nat 'a = (nat 0))) ' = (list (add (nat 'a = (nat 0)) 'rm = (nat 'a = (nat 0)) 'r = (nat 'r = (nat 'a = (nat 0))) ' = (add (nat 'a = (nat 0)) (nat 'b = 0) 'r = (nat 'a = (nat 0)) ')) (list (mul (nat 'a = (nat 0)) (nat 'b = (nat 0)) 'rm = (nat 'a = (nat 0)) ' = (list (add (nat 'a = (nat 0)) 'rm = (nat 0) 'r = (nat 'a = (nat 0)) ') (list (mul (nat 'a = (nat 0)) (nat 'b = 0) 'rm = (nat 0) ') (list)))) (list)))) (list (fac (nat 'k = (nat 0)) 'n1 = (nat 'a = (nat 0)) ' = (list (mul 'n1 = (nat (nat 0)) (nat (nat 'k = 0)) 'n = (nat 'a = (nat 0)) ' = (list (add (nat 'a = (nat 0)) 'rm = (nat 0) 'r = (nat 'a = (nat 0)) ') (list (mul (nat 'a = (nat 0)) (nat 'b = 0) 'rm = (nat 0) ') (list)))) (list (fac (nat 'k = 0) 'n1 = (nat (nat 0)) ') (list)))) (list))))"]);

            // fac(3) = 6
            should(run.queryArray(
                Z.t(
                    Z.c("fac"),
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0"))))), // 3
                    Z.v("r"),
                    Z.v()
                )
            )).eql(["(fac (nat (nat (nat (nat 0)))) 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0))))))) ' = (list (mul 'n1 = (nat 'r = (nat 'a = (nat 0))) (nat (nat 'k = (nat (nat 0)))) 'n = (nat 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0))))))) ' = (list (add (nat 'a = (nat 'a = (nat 0))) 'rm = (nat 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0))))) 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0))))))) ' = (add (nat 'a = (nat 'a = (nat 0))) (nat 'b = (nat 'a = (nat 'a = (nat 0)))) 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0)))))) ' = (add (nat 'a = (nat 'a = (nat 0))) (nat 'b = (nat 'a = (nat 0))) 'r = (nat 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0))))) ' = (add (nat 'a = (nat 'a = (nat 0))) (nat 'b = (nat 0)) 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0)))) ' = (add (nat 'a = (nat 'a = (nat 0))) (nat 'b = 0) 'r = (nat 'a = (nat 'a = (nat 0))) '))))) (list (mul (nat 'a = (nat 'a = (nat 0))) (nat 'b = (nat (nat 0))) 'rm = (nat 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0))))) ' = (list (add (nat 'a = (nat 'a = (nat 0))) 'rm = (nat 'a = (nat 'a = (nat 0))) 'r = (nat 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0))))) ' = (add (nat 'a = (nat 'a = (nat 0))) (nat 'b = (nat 0)) 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0)))) ' = (add (nat 'a = (nat 'a = (nat 0))) (nat 'b = 0) 'r = (nat 'a = (nat 'a = (nat 0))) '))) (list (mul (nat 'a = (nat 'a = (nat 0))) (nat 'b = (nat 0)) 'rm = (nat 'a = (nat 'a = (nat 0))) ' = (list (add (nat 'a = (nat 'a = (nat 0))) 'rm = (nat 0) 'r = (nat 'a = (nat 'a = (nat 0))) ') (list (mul (nat 'a = (nat 'a = (nat 0))) (nat 'b = 0) 'rm = (nat 0) ') (list)))) (list)))) (list)))) (list (fac (nat 'k = (nat (nat 0))) 'n1 = (nat 'r = (nat 'a = (nat 0))) ' = (list (mul 'n1 = (nat 'a = (nat 0)) (nat (nat 'k = (nat 0))) 'n = (nat 'r = (nat 'a = (nat 0))) ' = (list (add (nat 'a = (nat 0)) 'rm = (nat 'a = (nat 0)) 'r = (nat 'r = (nat 'a = (nat 0))) ' = (add (nat 'a = (nat 0)) (nat 'b = 0) 'r = (nat 'a = (nat 0)) ')) (list (mul (nat 'a = (nat 0)) (nat 'b = (nat 0)) 'rm = (nat 'a = (nat 0)) ' = (list (add (nat 'a = (nat 0)) 'rm = (nat 0) 'r = (nat 'a = (nat 0)) ') (list (mul (nat 'a = (nat 0)) (nat 'b = 0) 'rm = (nat 0) ') (list)))) (list)))) (list (fac (nat 'k = (nat 0)) 'n1 = (nat 'a = (nat 0)) ' = (list (mul 'n1 = (nat (nat 0)) (nat (nat 'k = 0)) 'n = (nat 'a = (nat 0)) ' = (list (add (nat 'a = (nat 0)) 'rm = (nat 0) 'r = (nat 'a = (nat 0)) ') (list (mul (nat 'a = (nat 0)) (nat 'b = 0) 'rm = (nat 0) ') (list)))) (list (fac (nat 'k = 0) 'n1 = (nat (nat 0)) ') (list)))) (list)))) (list))))"]);

        });
    });
});