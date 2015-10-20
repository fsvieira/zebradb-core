var should = require("should");
var Z = require("../lib/unify");

describe('Factorial Parser Tests.', function() {
    describe('Natural Numbers', function() {
        it('Should declare ~Peanno numbers', function () {

            var zquery = new Z.run(
                "(nat 0)\n" +
                "(nat (nat 'n))"
            );

            var query = function (q, len) {
                return Z.toString(zquery(q, len));
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
                    500
                )
            ).eql(
                "(nat 0)\n" + 
                "(nat (nat 0))\n" + 
                "(nat (nat (nat 0)))\n" + 
                "(nat (nat (nat (nat 0))))\n" + 
                "(nat (nat (nat (nat (nat 0)))))"
            );
        });

        it('Should declare a add func', function () {

            var zquery = new Z.run(
                "(nat 0)" +
                "(nat (nat 'n))" +

                // a . 0 = a,
                "(+ (nat 'a) (nat 0) (nat 'a) ')" +

                // a . S(b) = a + (a . b)
                "(+ (nat 'a) (nat (nat 'b)) (nat 'r) (+ (nat 'a) (nat 'b) 'r '))"
            );

            var query = function (q, len) {
                return Z.toString(zquery(q, len));
            };

            // 0 + 0 = 0
            should(
                query(
                    "(+ (nat 0) (nat 0) 'r ')"
                )
            ).eql(
                "(+ (nat 0) (nat 0) (nat 0) \'x$1)"
            );
            
            // 1 + 0 = 1
            should(
                query(
                    "(+ (nat (nat 0)) (nat 0) 'r ')"
                )
            ).eql(
                "(+ (nat (nat 0)) (nat 0) (nat (nat 0)) \'x$1)"
            );

            // 0 + 1 = 1
            should(
                query(
                    "(+ (nat 0) (nat (nat 0)) 'r ')"
                )
            ).eql(
                "(+ (nat 0) (nat (nat 0)) (nat (nat 0)) (+ (nat 0) (nat 0) (nat 0) \'x$0))"
            );

            // 2 + 3 = 5
            should(
                query(
                    "(+ (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) 'r ')"
                )
            ).eql(
                "(+ (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat 0)))))) (+ (nat (nat (nat 0))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (+ (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat (nat 0)))) (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) \'x$0))))"
            );

            // 3 + 2 = 5
            should(
                query(
                    "(+ (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) 'r ')"
                )
            ).eql("(+ (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat (nat 0)))))) (+ (nat (nat (nat (nat 0)))) (nat (nat 0)) (nat (nat (nat (nat (nat 0))))) (+ (nat (nat (nat (nat 0)))) (nat 0) (nat (nat (nat (nat 0)))) \'x$2)))");

            // 2 + 2 = 4
            should(
                query(
                    "(+ (nat (nat (nat 0))) (nat (nat (nat 0))) 'r ')"
                )
            ).eql(
                "(+ (nat (nat (nat 0))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (+ (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat (nat 0)))) (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) \'x$2)))"
            );
        });

        it('Should declare a list', function () {
            var zquery = new Z.run(
                "(list)" +
                "(list 'item (list ' '))" +
                "(list 'item (list))" +

                "(fruit banana)" +
                "(fruit strawberry)" +
                "(fruit apple)" +
                "(fruit papaya)"
            );

            var query = function (q, len) {
                return Z.toString(zquery(q, len));
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
            
            var zquery = new Z.run(
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
                return Z.toString(zquery(q, len));
            };

            // 0 * 0 = 0
            should(
                query(
                    "(* (nat 0) (nat 0) 'r ')"
                )
            ).eql(
                "(* (nat 0) (nat 0) (nat 0) \'x$1)"
            );

            
            // 1 * 0 = 0
            should(
                query(
                    "(* (nat (nat 0)) (nat 0) 'r ')"
                )
            ).eql(
                "(* (nat (nat 0)) (nat 0) (nat 0) \'x$1)"
            );
            
            // 0 * 1 = 0
            should(
                query(
                    "(* (nat 0) (nat (nat 0)) 'r ')"
                )
            ).eql(
                "(* (nat 0) (nat (nat 0)) (nat 0) (list (+ (nat 0) (nat 0) (nat 0) \'x$0) (list (* (nat 0) (nat 0) (nat 0) \'x$2) (list))))"
            );

            // 1 * 1 = 1
            should(
                query(
                    "(* (nat (nat 0)) (nat (nat 0)) 'r ')"
                )
            ).eql(
                "(* (nat (nat 0)) (nat (nat 0)) (nat (nat 0)) (list (+ (nat (nat 0)) (nat 0) (nat (nat 0)) \'x$0) (list (* (nat (nat 0)) (nat 0) (nat 0) \'x$2) (list))))"
            );
            
            // 2 * 1 = 1
            should(
                query(
                    "(* (nat (nat (nat 0))) (nat (nat 0)) 'r ')"
                )
            ).eql(
                "(* (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat 0))) (list (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) \'x$0) (list (* (nat (nat (nat 0))) (nat 0) (nat 0) \'x$2) (list))))"
            );

            // 1 * 2 = 2
            should(
                query(
                    "(* (nat (nat 0)) (nat (nat (nat 0))) 'r ')"
                )
            ).eql(
                "(* (nat (nat 0)) (nat (nat (nat 0))) (nat (nat (nat 0))) (list (+ (nat (nat 0)) (nat (nat 0)) (nat (nat (nat 0))) (+ (nat (nat 0)) (nat 0) (nat (nat 0)) \'x$2)) (list (* (nat (nat 0)) (nat (nat 0)) (nat (nat 0)) (list (+ (nat (nat 0)) (nat 0) (nat (nat 0)) \'x$1) (list (* (nat (nat 0)) (nat 0) (nat 0) \'x$0) (list)))) (list))))"
            );

            // 2 * 2 = 4
            should(
                query(
                    "(* (nat (nat (nat 0))) (nat (nat (nat 0))) 'r ')"
                )
            ).eql(
                "(* (nat (nat (nat 0))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (list (+ (nat (nat (nat 0))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (+ (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat (nat 0)))) (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) \'x$1))) (list (* (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat 0))) (list (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) \'x$2) (list (* (nat (nat (nat 0))) (nat 0) (nat 0) \'x$0) (list)))) (list))))"
            );

            // 2 * 3 = 6
            should(
                query(
                    "(* (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) 'r ')"
                )
            ).eql(
                "(* (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat (nat 0))))))) (list (+ (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (nat (nat (nat (nat (nat (nat (nat 0))))))) (+ (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat 0)))))) (+ (nat (nat (nat 0))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (+ (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat (nat 0)))) (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) \'x$3))))) (list (* (nat (nat (nat 0))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (list (+ (nat (nat (nat 0))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (+ (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat (nat 0)))) (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) \'x$5))) (list (* (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat 0))) (list (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) \'x$1) (list (* (nat (nat (nat 0))) (nat 0) (nat 0) \'x$0) (list)))) (list)))) (list))))"
            );

            // 3 * 2 = 6
            should(
                query(
                    "(* (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) 'r ')"
                )
            ).eql(
                "(* (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat (nat (nat 0))))))) (list (+ (nat (nat (nat (nat 0)))) (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat (nat 0))))))) (+ (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat (nat 0)))))) (+ (nat (nat (nat (nat 0)))) (nat (nat 0)) (nat (nat (nat (nat (nat 0))))) (+ (nat (nat (nat (nat 0)))) (nat 0) (nat (nat (nat (nat 0)))) \'x$0)))) (list (* (nat (nat (nat (nat 0)))) (nat (nat 0)) (nat (nat (nat (nat 0)))) (list (+ (nat (nat (nat (nat 0)))) (nat 0) (nat (nat (nat (nat 0)))) \'x$4) (list (* (nat (nat (nat (nat 0)))) (nat 0) (nat 0) \'x$1) (list)))) (list))))"
            );
        });

        it('Should declare a factorial func', function () {
            this.timeout(1000*60*5);
            var zquery = new Z.run(
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
                return Z.toString(zquery(q, len));
            };
            
            // fac(0) = 1
            should(
                query(
                    "(fac (nat 0) 'r ')"
                )
            ).eql("(fac (nat 0) (nat (nat 0)) \'x$1)");

            // fac(1) = 1
            should(
                query(
                    "(fac (nat (nat 0)) 'r ')"
                )
            ).eql(
                "(fac (nat (nat 0)) (nat (nat 0)) (list (* (nat (nat 0)) (nat (nat 0)) (nat (nat 0)) (list (+ (nat (nat 0)) (nat 0) (nat (nat 0)) \'x$1) (list (* (nat (nat 0)) (nat 0) (nat 0) \'x$0) (list)))) (list (fac (nat 0) (nat (nat 0)) \'x$2) (list))))"
            );

            // fac(2) = 2
            should(
                query(
                    "(fac (nat (nat (nat 0))) 'r ')"
                )
            ).eql(
                "(fac (nat (nat (nat 0))) (nat (nat (nat 0))) (list (* (nat (nat 0)) (nat (nat (nat 0))) (nat (nat (nat 0))) (list (+ (nat (nat 0)) (nat (nat 0)) (nat (nat (nat 0))) (+ (nat (nat 0)) (nat 0) (nat (nat 0)) \'x$3)) (list (* (nat (nat 0)) (nat (nat 0)) (nat (nat 0)) (list (+ (nat (nat 0)) (nat 0) (nat (nat 0)) \'x$5) (list (* (nat (nat 0)) (nat 0) (nat 0) \'x$2) (list)))) (list)))) (list (fac (nat (nat 0)) (nat (nat 0)) (list (* (nat (nat 0)) (nat (nat 0)) (nat (nat 0)) (list (+ (nat (nat 0)) (nat 0) (nat (nat 0)) \'x$0) (list (* (nat (nat 0)) (nat 0) (nat 0) \'x$1) (list)))) (list (fac (nat 0) (nat (nat 0)) \'x$4) (list)))) (list))))"
            );

            // fac(3) = 6
            /*
            TODO: this takes a lot of time.
            should(
                query(
                    "(fac (nat (nat (nat (nat 0)))) 'r ')"
                )
            ).eql(
                "(fac (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat (nat 0))))))) (list (* (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat (nat 0))))))) (list (+ (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (nat (nat (nat (nat (nat (nat (nat 0))))))) (+ (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat 0)))))) (+ (nat (nat (nat 0))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (+ (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat (nat 0)))) (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) \'x$3))))) (list (* (nat (nat (nat 0))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (list (+ (nat (nat (nat 0))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (+ (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat (nat 0)))) (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) \'x$14))) (list (* (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat 0))) (list (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) \'x$7) (list (* (nat (nat (nat 0))) (nat 0) (nat 0) \'x$5) (list)))) (list)))) (list)))) (list (fac (nat (nat (nat 0))) (nat (nat (nat 0))) (list (* (nat (nat 0)) (nat (nat (nat 0))) (nat (nat (nat 0))) (list (+ (nat (nat 0)) (nat (nat 0)) (nat (nat (nat 0))) (+ (nat (nat 0)) (nat 0) (nat (nat 0)) \'x$8)) (list (* (nat (nat 0)) (nat (nat 0)) (nat (nat 0)) (list (+ (nat (nat 0)) (nat 0) (nat (nat 0)) \'x$6) (list (* (nat (nat 0)) (nat 0) (nat 0) \'x$4) (list)))) (list)))) (list (fac (nat (nat 0)) (nat (nat 0)) (list (* (nat (nat 0)) (nat (nat 0)) (nat (nat 0)) (list (+ (nat (nat 0)) (nat 0) (nat (nat 0)) \'x$0) (list (* (nat (nat 0)) (nat 0) (nat 0) \'x$9) (list)))) (list (fac (nat 0) (nat (nat 0)) \'x$1) (list)))) (list)))) (list))))"
            );*/

        });
    });
});