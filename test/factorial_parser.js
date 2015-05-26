var should = require("should");
var Z = require("../lib/z");
var ZQuery = require("../lib/zquery");
var D = require("../lib/zquery_debug");

describe('Factorial Parser Tests.', function() {
    describe('Natural Numbers', function() {
        it('Should declare ~Peanno numbers', function () {
            var run; 
            
            run = new ZQuery.Run(
                "(nat 0)\n" +
                "(nat (nat 'n))"
            );

            should(run.queryArray (
                "(nat (nat 1))"
            )).eql([]);

            should(run.queryArray (
                "(nat (nat 0))"
            )).eql(["(nat (nat 0))"]);

            should(run.queryArray(
                "(nat 'n)",
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
                    "(nat 0)" +
                    "(nat (nat 'n))" +

                    // a . 0 = a,
                    "(+ (nat 'a) (nat 0) (nat 'a) ')" +

                    // a . S(b) = a + (a . b)
                    "(+ (nat 'a) (nat (nat 'b)) (nat 'r) (+ (nat 'a) (nat 'b) 'r '))"
            );
            
            // 0 + 0 = 0
            should(run.queryArray (
                "(+ (nat 0) (nat 0) 'r ')"
            )).eql(["(+ (nat 0) (nat 0) 'r = (nat 'a = 0) ')" ]);
            
            // 1 + 0 = 1
            should(run.queryArray (
                "(+ (nat (nat 0)) (nat 0) 'r ')"
            )).eql(["(+ (nat (nat 0)) (nat 0) 'r = (nat 'a = (nat 0)) ')"]);
            
            // 0 + 1 = 1
            should(run.queryArray (
                "(+ (nat 0) (nat (nat 0)) 'r ')"
            )).eql(["(+ (nat 0) (nat (nat 0)) 'r = (nat 'r = (nat 'a = 0)) ' = (+ (nat 'a = 0) (nat 'b = 0) 'r = (nat 'a = 0) '))"]);
            
            // 2 + 3 = 5
            should(run.queryArray (
                "(+ (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) 'r ')"
            )).eql(["(+ (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0)))))) ' = (+ (nat 'a = (nat (nat 0))) (nat 'b = (nat (nat 0))) 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0))))) ' = (+ (nat 'a = (nat (nat 0))) (nat 'b = (nat 0)) 'r = (nat 'r = (nat 'a = (nat (nat 0)))) ' = (+ (nat 'a = (nat (nat 0))) (nat 'b = 0) 'r = (nat 'a = (nat (nat 0))) '))))"]);

            // 3 + 2 = 5
            should(run.queryArray (
                "(+ (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) 'r ')"
            )).eql(["(+ (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat (nat 0)))))) ' = (+ (nat 'a = (nat (nat (nat 0)))) (nat 'b = (nat 0)) 'r = (nat 'r = (nat 'a = (nat (nat (nat 0))))) ' = (+ (nat 'a = (nat (nat (nat 0)))) (nat 'b = 0) 'r = (nat 'a = (nat (nat (nat 0)))) ')))"]);

            // 2 + 3 = 5
            should(run.queryArray (
                "(+ (nat (nat (nat 0))) (nat (nat (nat 0))) 'r ')"
            )).eql(["(+ (nat (nat (nat 0))) (nat (nat (nat 0))) 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0))))) ' = (+ (nat 'a = (nat (nat 0))) (nat 'b = (nat 0)) 'r = (nat 'r = (nat 'a = (nat (nat 0)))) ' = (+ (nat 'a = (nat (nat 0))) (nat 'b = 0) 'r = (nat 'a = (nat (nat 0))) ')))"]);
        });
          
        it('Should declare a list', function () {
            var run;
            
            run = new ZQuery.Run(
                "(list)" +
                "(list 'item (list ' '))" +
                "(list 'item (list))" +

                "(fruit banana)" +
                "(fruit strawberry)" +
                "(fruit apple)" +
                "(fruit papaya)"
            );

            should(run.queryArray("(list)")).eql(["(list)"]);

            should(run.queryArray(
                "(list (fruit banana) (list (fruit apple) (list)))"
            )).eql(["(list (fruit banana) (list (fruit apple) (list)))"]);

            should(run.queryArray(
                "(list (fruit 'p) (list (fruit ^'p) (list)))"
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
                // Nat
                "(nat 0)" +
                "(nat (nat 'n))" +

                // Add
                // a . 0 = a,
                "(+ (nat 'a) (nat 0) (nat 'a) ')" +

                // a . S(b) = a + (a . b)
                "(+ (nat 'a) (nat (nat 'b)) (nat 'r) (+ (nat 'a) (nat 'b) 'r '))" +

                // List
                "(list)" +
                "(list 'item (list ' '))" +
                "(list 'item (list))" +

                // Mul                    
                // a . 0 = 0
                "(* (nat 'a) (nat 0) (nat 0) ')" +

                // a . S(b) = a + (a . b)
                "(* (nat 'a) (nat (nat 'b)) 'r (list (+ (nat 'a) 'rm 'r ') (list (* (nat 'a) (nat 'b) 'rm ') (list))))"
            );

            // 0 * 0 = 0
            should(run.queryArray(
                "(* (nat 0) (nat 0) 'r ')"
            )).eql(["(* (nat 0) (nat 0) 'r = (nat 0) ')"]);

            
            // 1 * 0 = 0
            should(run.queryArray(
                "(* (nat (nat 0)) (nat 0) 'r ')"
            )).eql(["(* (nat (nat 0)) (nat 0) 'r = (nat 0) ')"]);
            
            // 0 * 1 = 0
            should(run.queryArray(
                "(* (nat 0) (nat (nat 0)) 'r ')"
            )).eql(["(* (nat 0) (nat (nat 0)) 'r = (nat 'a = 0) ' = (list (+ (nat 'a = 0) 'rm = (nat 0) 'r = (nat 'a = 0) ') (list (* (nat 'a = 0) (nat 'b = 0) 'rm = (nat 0) ') (list))))"]);

            // 1 * 1 = 1
            should(run.queryArray(
                "(* (nat (nat 0)) (nat (nat 0)) 'r ')"
            )).eql(["(* (nat (nat 0)) (nat (nat 0)) 'r = (nat 'a = (nat 0)) ' = (list (+ (nat 'a = (nat 0)) 'rm = (nat 0) 'r = (nat 'a = (nat 0)) ') (list (* (nat 'a = (nat 0)) (nat 'b = 0) 'rm = (nat 0) ') (list))))"]);
            
            // 2 * 1 = 1
            should(run.queryArray(
                "(* (nat (nat (nat 0))) (nat (nat 0)) 'r ')"
            )).eql(["(* (nat (nat (nat 0))) (nat (nat 0)) 'r = (nat 'a = (nat (nat 0))) ' = (list (+ (nat 'a = (nat (nat 0))) 'rm = (nat 0) 'r = (nat 'a = (nat (nat 0))) ') (list (* (nat 'a = (nat (nat 0))) (nat 'b = 0) 'rm = (nat 0) ') (list))))"]);

            // 1 * 2 = 2
            should(run.queryArray(
                "(* (nat (nat 0)) (nat (nat (nat 0))) 'r ')"
            )).eql(["(* (nat (nat 0)) (nat (nat (nat 0))) 'r = (nat 'r = (nat 'a = (nat 0))) ' = (list (+ (nat 'a = (nat 0)) 'rm = (nat 'a = (nat 0)) 'r = (nat 'r = (nat 'a = (nat 0))) ' = (+ (nat 'a = (nat 0)) (nat 'b = 0) 'r = (nat 'a = (nat 0)) ')) (list (* (nat 'a = (nat 0)) (nat 'b = (nat 0)) 'rm = (nat 'a = (nat 0)) ' = (list (+ (nat 'a = (nat 0)) 'rm = (nat 0) 'r = (nat 'a = (nat 0)) ') (list (* (nat 'a = (nat 0)) (nat 'b = 0) 'rm = (nat 0) ') (list)))) (list))))"]);

            // 2 * 2
            should(run.queryArray(
                "(* (nat (nat (nat 0))) (nat (nat (nat 0))) 'r ')"
            )).eql(["(* (nat (nat (nat 0))) (nat (nat (nat 0))) 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0))))) ' = (list (+ (nat 'a = (nat (nat 0))) 'rm = (nat 'a = (nat (nat 0))) 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0))))) ' = (+ (nat 'a = (nat (nat 0))) (nat 'b = (nat 0)) 'r = (nat 'r = (nat 'a = (nat (nat 0)))) ' = (+ (nat 'a = (nat (nat 0))) (nat 'b = 0) 'r = (nat 'a = (nat (nat 0))) '))) (list (* (nat 'a = (nat (nat 0))) (nat 'b = (nat 0)) 'rm = (nat 'a = (nat (nat 0))) ' = (list (+ (nat 'a = (nat (nat 0))) 'rm = (nat 0) 'r = (nat 'a = (nat (nat 0))) ') (list (* (nat 'a = (nat (nat 0))) (nat 'b = 0) 'rm = (nat 0) ') (list)))) (list))))"]);

            // 2 * 3 = 6
            should(run.queryArray(
                "(* (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) 'r ')"
            )).eql(["(* (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0))))))) ' = (list (+ (nat 'a = (nat (nat 0))) 'rm = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0))))) 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0))))))) ' = (+ (nat 'a = (nat (nat 0))) (nat 'b = (nat 'a = (nat (nat 0)))) 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0)))))) ' = (+ (nat 'a = (nat (nat 0))) (nat 'b = (nat (nat 0))) 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0))))) ' = (+ (nat 'a = (nat (nat 0))) (nat 'b = (nat 0)) 'r = (nat 'r = (nat 'a = (nat (nat 0)))) ' = (+ (nat 'a = (nat (nat 0))) (nat 'b = 0) 'r = (nat 'a = (nat (nat 0))) '))))) (list (* (nat 'a = (nat (nat 0))) (nat 'b = (nat (nat 0))) 'rm = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0))))) ' = (list (+ (nat 'a = (nat (nat 0))) 'rm = (nat 'a = (nat (nat 0))) 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0))))) ' = (+ (nat 'a = (nat (nat 0))) (nat 'b = (nat 0)) 'r = (nat 'r = (nat 'a = (nat (nat 0)))) ' = (+ (nat 'a = (nat (nat 0))) (nat 'b = 0) 'r = (nat 'a = (nat (nat 0))) '))) (list (* (nat 'a = (nat (nat 0))) (nat 'b = (nat 0)) 'rm = (nat 'a = (nat (nat 0))) ' = (list (+ (nat 'a = (nat (nat 0))) 'rm = (nat 0) 'r = (nat 'a = (nat (nat 0))) ') (list (* (nat 'a = (nat (nat 0))) (nat 'b = 0) 'rm = (nat 0) ') (list)))) (list)))) (list))))"]);
            
            // 3 * 2 = 6
            should(run.queryArray(
                "(* (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) 'r ')"
            )).eql(["(* (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat (nat 0))))))) ' = (list (+ (nat 'a = (nat (nat (nat 0)))) 'rm = (nat 'a = (nat (nat (nat 0)))) 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat (nat 0))))))) ' = (+ (nat 'a = (nat (nat (nat 0)))) (nat 'b = (nat (nat 0))) 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat (nat 0)))))) ' = (+ (nat 'a = (nat (nat (nat 0)))) (nat 'b = (nat 0)) 'r = (nat 'r = (nat 'a = (nat (nat (nat 0))))) ' = (+ (nat 'a = (nat (nat (nat 0)))) (nat 'b = 0) 'r = (nat 'a = (nat (nat (nat 0)))) ')))) (list (* (nat 'a = (nat (nat (nat 0)))) (nat 'b = (nat 0)) 'rm = (nat 'a = (nat (nat (nat 0)))) ' = (list (+ (nat 'a = (nat (nat (nat 0)))) 'rm = (nat 0) 'r = (nat 'a = (nat (nat (nat 0)))) ') (list (* (nat 'a = (nat (nat (nat 0)))) (nat 'b = 0) 'rm = (nat 0) ') (list)))) (list))))"]);
        });

        it('Should declare a factorial func', function () {
            var run;
            
            run = new ZQuery.Run(
                // Nat
                "(nat 0)" +
                "(nat (nat 'n))" +

                // Add
                // a . 0 = a,
                "(+ (nat 'a) (nat 0) (nat 'a) ')" +

                // a . S(b) = a + (a . b)
                "(+ (nat 'a) (nat (nat 'b)) (nat 'r) (+ (nat 'a) (nat 'b) 'r '))" +

                // List
                "(list)" +
                "(list 'item (list ' '))" +
                "(list 'item (list))" +

                // Mul                    
                // a . 0 = 0
                "(* (nat 'a) (nat 0) (nat 0) ')" +

                // a . S(b) = a + (a . b)
                "(* (nat 'a) (nat (nat 'b)) 'r (list (+ (nat 'a) 'rm 'r ') (list (* (nat 'a) (nat 'b) 'rm ') (list))))" +

                // 0! = 1
                "(fac (nat 0) (nat (nat 0)) ')" +
                "(fac (nat (nat 'k)) 'n (list (* 'n1 (nat (nat 'k)) 'n ') (list (fac (nat 'k) 'n1 ') (list))))"
            );
            
            // fac(0) = 1
            should(run.queryArray(
                "(fac (nat 0) 'r ')"
            )).eql(["(fac (nat 0) 'r = (nat (nat 0)) ')"]);


            // fac(1) = 1
            should(run.queryArray(
                "(fac (nat (nat 0)) 'r ')"
            )).eql(["(fac (nat (nat 0)) 'r = (nat 'a = (nat 0)) ' = (list (* 'n1 = (nat (nat 0)) (nat (nat 'k = 0)) 'n = (nat 'a = (nat 0)) ' = (list (+ (nat 'a = (nat 0)) 'rm = (nat 0) 'r = (nat 'a = (nat 0)) ') (list (* (nat 'a = (nat 0)) (nat 'b = 0) 'rm = (nat 0) ') (list)))) (list (fac (nat 'k = 0) 'n1 = (nat (nat 0)) ') (list))))"]);

            // fac(2) = 2
            should(run.queryArray(
                "(fac (nat (nat (nat 0))) 'r ')"
            )).eql(["(fac (nat (nat (nat 0))) 'r = (nat 'r = (nat 'a = (nat 0))) ' = (list (* 'n1 = (nat 'a = (nat 0)) (nat (nat 'k = (nat 0))) 'n = (nat 'r = (nat 'a = (nat 0))) ' = (list (+ (nat 'a = (nat 0)) 'rm = (nat 'a = (nat 0)) 'r = (nat 'r = (nat 'a = (nat 0))) ' = (+ (nat 'a = (nat 0)) (nat 'b = 0) 'r = (nat 'a = (nat 0)) ')) (list (* (nat 'a = (nat 0)) (nat 'b = (nat 0)) 'rm = (nat 'a = (nat 0)) ' = (list (+ (nat 'a = (nat 0)) 'rm = (nat 0) 'r = (nat 'a = (nat 0)) ') (list (* (nat 'a = (nat 0)) (nat 'b = 0) 'rm = (nat 0) ') (list)))) (list)))) (list (fac (nat 'k = (nat 0)) 'n1 = (nat 'a = (nat 0)) ' = (list (* 'n1 = (nat (nat 0)) (nat (nat 'k = 0)) 'n = (nat 'a = (nat 0)) ' = (list (+ (nat 'a = (nat 0)) 'rm = (nat 0) 'r = (nat 'a = (nat 0)) ') (list (* (nat 'a = (nat 0)) (nat 'b = 0) 'rm = (nat 0) ') (list)))) (list (fac (nat 'k = 0) 'n1 = (nat (nat 0)) ') (list)))) (list))))"]);

            // fac(3) = 6
            should(run.queryArray(
                "(fac (nat (nat (nat (nat 0)))) 'r ')"
            )).eql(["(fac (nat (nat (nat (nat 0)))) 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0))))))) ' = (list (* 'n1 = (nat 'r = (nat 'a = (nat 0))) (nat (nat 'k = (nat (nat 0)))) 'n = (nat 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0))))))) ' = (list (+ (nat 'a = (nat 'a = (nat 0))) 'rm = (nat 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0))))) 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0))))))) ' = (+ (nat 'a = (nat 'a = (nat 0))) (nat 'b = (nat 'a = (nat 'a = (nat 0)))) 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0)))))) ' = (+ (nat 'a = (nat 'a = (nat 0))) (nat 'b = (nat 'a = (nat 0))) 'r = (nat 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0))))) ' = (+ (nat 'a = (nat 'a = (nat 0))) (nat 'b = (nat 0)) 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0)))) ' = (+ (nat 'a = (nat 'a = (nat 0))) (nat 'b = 0) 'r = (nat 'a = (nat 'a = (nat 0))) '))))) (list (* (nat 'a = (nat 'a = (nat 0))) (nat 'b = (nat (nat 0))) 'rm = (nat 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0))))) ' = (list (+ (nat 'a = (nat 'a = (nat 0))) 'rm = (nat 'a = (nat 'a = (nat 0))) 'r = (nat 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0))))) ' = (+ (nat 'a = (nat 'a = (nat 0))) (nat 'b = (nat 0)) 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0)))) ' = (+ (nat 'a = (nat 'a = (nat 0))) (nat 'b = 0) 'r = (nat 'a = (nat 'a = (nat 0))) '))) (list (* (nat 'a = (nat 'a = (nat 0))) (nat 'b = (nat 0)) 'rm = (nat 'a = (nat 'a = (nat 0))) ' = (list (+ (nat 'a = (nat 'a = (nat 0))) 'rm = (nat 0) 'r = (nat 'a = (nat 'a = (nat 0))) ') (list (* (nat 'a = (nat 'a = (nat 0))) (nat 'b = 0) 'rm = (nat 0) ') (list)))) (list)))) (list)))) (list (fac (nat 'k = (nat (nat 0))) 'n1 = (nat 'r = (nat 'a = (nat 0))) ' = (list (* 'n1 = (nat 'a = (nat 0)) (nat (nat 'k = (nat 0))) 'n = (nat 'r = (nat 'a = (nat 0))) ' = (list (+ (nat 'a = (nat 0)) 'rm = (nat 'a = (nat 0)) 'r = (nat 'r = (nat 'a = (nat 0))) ' = (+ (nat 'a = (nat 0)) (nat 'b = 0) 'r = (nat 'a = (nat 0)) ')) (list (* (nat 'a = (nat 0)) (nat 'b = (nat 0)) 'rm = (nat 'a = (nat 0)) ' = (list (+ (nat 'a = (nat 0)) 'rm = (nat 0) 'r = (nat 'a = (nat 0)) ') (list (* (nat 'a = (nat 0)) (nat 'b = 0) 'rm = (nat 0) ') (list)))) (list)))) (list (fac (nat 'k = (nat 0)) 'n1 = (nat 'a = (nat 0)) ' = (list (* 'n1 = (nat (nat 0)) (nat (nat 'k = 0)) 'n = (nat 'a = (nat 0)) ' = (list (+ (nat 'a = (nat 0)) 'rm = (nat 0) 'r = (nat 'a = (nat 0)) ') (list (* (nat 'a = (nat 0)) (nat 'b = 0) 'rm = (nat 0) ') (list)))) (list (fac (nat 'k = 0) 'n1 = (nat (nat 0)) ') (list)))) (list)))) (list))))"]);

        });
    });
});