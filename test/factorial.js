var should = require("should");
var Z = require("../lib/z");

describe('Factorial Parser Tests.', function() {
    describe('Natural Numbers', function() {
        it('Should declare ~Peanno numbers', function () {

            var run = new Z.Run(
                "(nat 0)\n" +
                "(nat (nat 'n))"
            );

            var query = function (q, len) {
                return Z.toString(run.query(q, len));
            };
            
            should(
                query("(nat (nat 1))")
            ).eql("");

            should(
                query("(nat (nat 0))")
            ).eql("(nat (nat 0))");
            should(
                query(
                    "(nat 'n)",
                    7
                )
            ).eql(
                "(nat 0)\n" + 
                "(nat (nat 0))\n" + 
                "(nat (nat (nat 0)))\n" + 
                "(nat (nat (nat (nat 0))))"
            );
        });

        it('Should declare a add func', function () {

            var run = new Z.Run(
                "(nat 0)" +
                "(nat (nat 'n))" +

                // a . 0 = a,
                "(+ (nat 'a) (nat 0) (nat 'a) ')" +

                // a . S(b) = a + (a . b)
                "(+ (nat 'a) (nat (nat 'b)) (nat 'r) (+ (nat 'a) (nat 'b) 'r '))"
            );

            var query = function (q, len) {
                return Z.toString(run.query(q, len));
            };

            // 0 + 0 = 0
            should(
                query(
                    "(+ (nat 0) (nat 0) 'r ')"
                )
            ).eql(
                "(+ (nat 0) (nat 0) (nat 0) \'x$7)"
            );
            
            // 1 + 0 = 1
            should(
                query(
                    "(+ (nat (nat 0)) (nat 0) 'r ')"
                )
            ).eql(
                "(+ (nat (nat 0)) (nat 0) (nat (nat 0)) \'x$8)"
            );

            // 0 + 1 = 1
            should(
                query(
                    "(+ (nat 0) (nat (nat 0)) 'r ')"
                )
            ).eql(
                "(+ (nat 0) (nat (nat 0)) (nat (nat 0)) (+ (nat 0) (nat 0) (nat 0) \'x$11))"
            );

            // 2 + 3 = 5
            should(
                query(
                    "(+ (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) 'r ')"
                )
            ).eql(
                "(+ (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat 0)))))) (+ (nat (nat (nat 0))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (+ (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat (nat 0)))) (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) \'x$21))))"
            );

            // 3 + 2 = 5
            should(
                query(
                    "(+ (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) 'r ')"
                )
            ).eql("(+ (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat (nat 0)))))) (+ (nat (nat (nat (nat 0)))) (nat (nat 0)) (nat (nat (nat (nat (nat 0))))) (+ (nat (nat (nat (nat 0)))) (nat 0) (nat (nat (nat (nat 0)))) \'x$18)))");

            // 2 + 2 = 4
            should(
                query(
                    "(+ (nat (nat (nat 0))) (nat (nat (nat 0))) 'r ')"
                )
            ).eql(
                "(+ (nat (nat (nat 0))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (+ (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat (nat 0)))) (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) \'x$17)))"
            );
        });

        it('Should declare a list', function () {
            var run = new Z.Run(
                "(list)" +
                "(list 'item (list ' '))" +
                "(list 'item (list))" +

                "(fruit banana)" +
                "(fruit strawberry)" +
                "(fruit apple)" +
                "(fruit papaya)"
            );

            var query = function (q, len) {
                return Z.toString(run.query(q, len));
            };
            
            should(query("(list)")).eql("(list)");

            should(
                query(
                    "(list (fruit banana) (list (fruit apple) (list)))"
                )
            ).eql(
                "(list (fruit banana) (list (fruit apple) (list)))"
            );

            should(
                query(
                    "(list (fruit 'p) (list (fruit ^'p) (list)))"
                )
            ).eql(
                "(list (fruit banana) (list (fruit strawberry) (list)))\n" +
                "(list (fruit banana) (list (fruit apple) (list)))\n" +
                "(list (fruit banana) (list (fruit papaya) (list)))\n" +
                "(list (fruit strawberry) (list (fruit banana) (list)))\n" +
                "(list (fruit strawberry) (list (fruit apple) (list)))\n" +
                "(list (fruit strawberry) (list (fruit papaya) (list)))\n" +
                "(list (fruit apple) (list (fruit banana) (list)))\n" +
                "(list (fruit apple) (list (fruit strawberry) (list)))\n" +
                "(list (fruit apple) (list (fruit papaya) (list)))\n" +
                "(list (fruit papaya) (list (fruit banana) (list)))\n" +
                "(list (fruit papaya) (list (fruit strawberry) (list)))\n" +
                "(list (fruit papaya) (list (fruit apple) (list)))"
            );
        });

        it('Should declare a mul func', function () {
            this.timeout(1000*60*5);
            
            var run = new Z.Run(
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

            var query = function (q, len) {
                return Z.toString(run.query(q, len));
            };

            // 0 * 0 = 0
            should(
                query(
                    "(* (nat 0) (nat 0) 'r ')"
                )
            ).eql(
                "(* (nat 0) (nat 0) (nat 0) \'x$7)"
            );

            
            // 1 * 0 = 0
            should(
                query(
                    "(* (nat (nat 0)) (nat 0) 'r ')"
                )
            ).eql(
                "(* (nat (nat 0)) (nat 0) (nat 0) \'x$8)"
            );
            
            // 0 * 1 = 0
            should(
                query(
                    "(* (nat 0) (nat (nat 0)) 'r ')"
                )
            ).eql(
                "(* (nat 0) (nat (nat 0)) (nat 0) (list (+ (nat 0) (nat 0) (nat 0) \'x$12) (list (* (nat 0) (nat 0) (nat 0) \'x$16) (list))))"
            );

            // 1 * 1 = 1
            should(
                query(
                    "(* (nat (nat 0)) (nat (nat 0)) 'r ')"
                )
            ).eql(
                "(* (nat (nat 0)) (nat (nat 0)) (nat (nat 0)) (list (+ (nat (nat 0)) (nat 0) (nat (nat 0)) \'x$13) (list (* (nat (nat 0)) (nat 0) (nat 0) \'x$17) (list))))"
            );
            
            // 2 * 1 = 1
            should(
                query(
                    "(* (nat (nat (nat 0))) (nat (nat 0)) 'r ')"
                )
            ).eql(
                "(* (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat 0))) (list (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) \'x$14) (list (* (nat (nat (nat 0))) (nat 0) (nat 0) \'x$18) (list))))"
            );

            // 1 * 2 = 2
            should(
                query(
                    "(* (nat (nat 0)) (nat (nat (nat 0))) 'r ')"
                )
            ).eql(
                "(* (nat (nat 0)) (nat (nat (nat 0))) (nat (nat (nat 0))) (list (+ (nat (nat 0)) (nat (nat 0)) (nat (nat (nat 0))) (+ (nat (nat 0)) (nat 0) (nat (nat 0)) \'x$17)) (list (* (nat (nat 0)) (nat (nat 0)) (nat (nat 0)) (list (+ (nat (nat 0)) (nat 0) (nat (nat 0)) \'x$24) (list (* (nat (nat 0)) (nat 0) (nat 0) \'x$28) (list)))) (list))))"
            );

            // 2 * 2 = 4
            should(
                query(
                    "(* (nat (nat (nat 0))) (nat (nat (nat 0))) 'r ')"
                )
            ).eql(
                "(* (nat (nat (nat 0))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (list (+ (nat (nat (nat 0))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (+ (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat (nat 0)))) (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) \'x$21))) (list (* (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat 0))) (list (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) \'x$29) (list (* (nat (nat (nat 0))) (nat 0) (nat 0) \'x$33) (list)))) (list))))"
            );

            // 2 * 3 = 6
            should(
                query(
                    "(* (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) 'r ')"
                )
            ).eql(
                "(* (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat (nat 0))))))) (list (+ (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (nat (nat (nat (nat (nat (nat (nat 0))))))) (+ (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat 0)))))) (+ (nat (nat (nat 0))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (+ (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat (nat 0)))) (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) \'x$30))))) (list (* (nat (nat (nat 0))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (list (+ (nat (nat (nat 0))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (+ (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat (nat 0)))) (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) \'x$44))) (list (* (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat 0))) (list (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) \'x$52) (list (* (nat (nat (nat 0))) (nat 0) (nat 0) \'x$56) (list)))) (list)))) (list))))"
            );

            // 3 * 2 = 6
            should(
                query(
                    "(* (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) 'r ')"
                )
            ).eql(
                "(* (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat (nat (nat 0))))))) (list (+ (nat (nat (nat (nat 0)))) (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat (nat 0))))))) (+ (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat (nat 0)))))) (+ (nat (nat (nat (nat 0)))) (nat (nat 0)) (nat (nat (nat (nat (nat 0))))) (+ (nat (nat (nat (nat 0)))) (nat 0) (nat (nat (nat (nat 0)))) \'x$25)))) (list (* (nat (nat (nat (nat 0)))) (nat (nat 0)) (nat (nat (nat (nat 0)))) (list (+ (nat (nat (nat (nat 0)))) (nat 0) (nat (nat (nat (nat 0)))) \'x$34) (list (* (nat (nat (nat (nat 0)))) (nat 0) (nat 0) \'x$38) (list)))) (list))))"
            );
        });

        it('Should declare a factorial func', function () {
            this.timeout(1000*60*5);
            var run = new Z.Run(
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
            
            var query = function (q, len) {
                return Z.toString(run.query(q, len));
            };
            
            // fac(0) = 1
            should(
                query(
                    "(fac (nat 0) 'r ')"
                )
            ).eql("(fac (nat 0) (nat (nat 0)) \'x$7)");

            // fac(1) = 1
            should(
                query(
                    "(fac (nat (nat 0)) 'r ')"
                )
            ).eql(
                "(fac (nat (nat 0)) (nat (nat 0)) (list (* (nat (nat 0)) (nat (nat 0)) (nat (nat 0)) (list (+ (nat (nat 0)) (nat 0) (nat (nat 0)) \'x$16) (list (* (nat (nat 0)) (nat 0) (nat 0) \'x$20) (list)))) (list (fac (nat 0) (nat (nat 0)) \'x$27) (list))))"
            );

            // fac(2) = 2
            should(
                query(
                    "(fac (nat (nat (nat 0))) 'r ')"
                )
            ).eql(
                "(fac (nat (nat (nat 0))) (nat (nat (nat 0))) (list (* (nat (nat 0)) (nat (nat (nat 0))) (nat (nat (nat 0))) (list (+ (nat (nat 0)) (nat (nat 0)) (nat (nat (nat 0))) (+ (nat (nat 0)) (nat 0) (nat (nat 0)) \'x$20)) (list (* (nat (nat 0)) (nat (nat 0)) (nat (nat 0)) (list (+ (nat (nat 0)) (nat 0) (nat (nat 0)) \'x$27) (list (* (nat (nat 0)) (nat 0) (nat 0) \'x$31) (list)))) (list)))) (list (fac (nat (nat 0)) (nat (nat 0)) (list (* (nat (nat 0)) (nat (nat 0)) (nat (nat 0)) (list (+ (nat (nat 0)) (nat 0) (nat (nat 0)) \'x$47) (list (* (nat (nat 0)) (nat 0) (nat 0) \'x$51) (list)))) (list (fac (nat 0) (nat (nat 0)) \'x$58) (list)))) (list))))"
            );

            // fac(3) = 6
            should(
                query(
                    "(fac (nat (nat (nat (nat 0)))) 'r ')"
                )
            ).eql(
                "(fac (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat (nat 0))))))) (list (* (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat (nat 0))))))) (list (+ (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (nat (nat (nat (nat (nat (nat (nat 0))))))) (+ (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat 0)))))) (+ (nat (nat (nat 0))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (+ (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat (nat 0)))) (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) \'x$33))))) (list (* (nat (nat (nat 0))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (list (+ (nat (nat (nat 0))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (+ (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat (nat 0)))) (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) \'x$47))) (list (* (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat 0))) (list (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) \'x$55) (list (* (nat (nat (nat 0))) (nat 0) (nat 0) \'x$59) (list)))) (list)))) (list)))) (list (fac (nat (nat (nat 0))) (nat (nat (nat 0))) (list (* (nat (nat 0)) (nat (nat (nat 0))) (nat (nat (nat 0))) (list (+ (nat (nat 0)) (nat (nat 0)) (nat (nat (nat 0))) (+ (nat (nat 0)) (nat 0) (nat (nat 0)) \'x$81)) (list (* (nat (nat 0)) (nat (nat 0)) (nat (nat 0)) (list (+ (nat (nat 0)) (nat 0) (nat (nat 0)) \'x$88) (list (* (nat (nat 0)) (nat 0) (nat 0) \'x$92) (list)))) (list)))) (list (fac (nat (nat 0)) (nat (nat 0)) (list (* (nat (nat 0)) (nat (nat 0)) (nat (nat 0)) (list (+ (nat (nat 0)) (nat 0) (nat (nat 0)) \'x$108) (list (* (nat (nat 0)) (nat 0) (nat 0) \'x$112) (list)))) (list (fac (nat 0) (nat (nat 0)) \'x$119) (list)))) (list)))) (list))))"
            );
            
            // fac(4) = 24
            /* TODO: this will timeout, as its too much :P
            should(
                query(
                    "(fac (nat (nat (nat (nat (nat 0))))) 'r ')"
                )
            ).eql(
                "(fac (nat (nat (nat (nat (nat 0))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))))))))))))) (list (* (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat 0))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))))))))))))) (list (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat 0)))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat 0))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat 0)) (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat 0) (nat (nat (nat (nat (nat (nat (nat 0))))))) 'x$113))))))))))))))))))) (list (* (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))))))) (list (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat 0)))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat 0))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat 0)) (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat 0) (nat (nat (nat (nat (nat (nat (nat 0))))))) 'x$164))))))))))))) (list (* (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))) (list (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat 0)))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat 0))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat 0)) (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat 0) (nat (nat (nat (nat (nat (nat (nat 0))))))) 'x$191))))))) (list (* (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat 0)) (nat (nat (nat (nat (nat (nat (nat 0))))))) (list (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat 0) (nat (nat (nat (nat (nat (nat (nat 0))))))) 'x$200) (list (* (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat 0) (nat 0) 'x$205) (list)))) (list)))) (list)))) (list)))) (list (fac (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat (nat 0))))))) (list (* (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat (nat 0))))))) (list (+ (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (nat (nat (nat (nat (nat (nat (nat 0))))))) (+ (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat 0)))))) (+ (nat (nat (nat 0))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (+ (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat (nat 0)))) (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) 'x$236))))) (list (* (nat (nat (nat 0))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (list (+ (nat (nat (nat 0))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (+ (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat (nat 0)))) (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) 'x$251))) (list (* (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat 0))) (list (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) 'x$260) (list (* (nat (nat (nat 0))) (nat 0) (nat 0) 'x$265) (list)))) (list)))) (list)))) (list (fac (nat (nat (nat 0))) (nat (nat (nat 0))) (list (* (nat (nat 0)) (nat (nat (nat 0))) (nat (nat (nat 0))) (list (+ (nat (nat 0)) (nat (nat 0)) (nat (nat (nat 0))) (+ (nat (nat 0)) (nat 0) (nat (nat 0)) 'x$284)) (list (* (nat (nat 0)) (nat (nat 0)) (nat (nat 0)) (list (+ (nat (nat 0)) (nat 0) (nat (nat 0)) 'x$293) (list (* (nat (nat 0)) (nat 0) (nat 0) 'x$298) (list)))) (list)))) (list (fac (nat (nat 0)) (nat (nat 0)) (list (* (nat (nat 0)) (nat (nat 0)) (nat (nat 0)) (list (+ (nat (nat 0)) (nat 0) (nat (nat 0)) 'x$313) (list (* (nat (nat 0)) (nat 0) (nat 0) 'x$318) (list)))) (list (fac (nat 0) (nat (nat 0)) 'x$323) (list)))) (list)))) (list)))) (list))))"
            );*/
        });
    });
});