const test = require("../lib/testing/test");

describe('Factorial Parser Tests.', function() {
    it('Should declare ~Peanno numbers', 
        test(
            `(nat 0)
            (nat (nat 'n))
            ?(nat (nat 1))
            ?(nat (nat 0))
            ?(nat 'n)`
            ,
            `?(nat (nat 1)):
                <empty> 
            ?(nat (nat 0)):
                @(nat @(nat 0))
            ?(nat 'n):
                @(nat 0)
                @(nat @(nat 0))
                @(nat @(nat @(nat 0)))
                @(nat @(nat @(nat @(nat 0))))
                @(nat @(nat @(nat @(nat @(nat 0)))))`
            ,
            {depth: 7}
        )
    );

    it('Should declare a add func', function() {
        this.timeout(1000 * 60 * 5);

        var run = new Z();

        run.add(
            "(nat 0)" +
            "(nat (nat 'n))" +

            // a . 0 = a,
            "(+ (nat 0) (nat 0) (nat 0) ')" +
            "(+ (nat (nat 'a)) (nat 0) (nat (nat 'a)) ')" +
            "(+ (nat 0) (nat (nat 'a)) (nat (nat 'a)) ')" +

            // a . S(b) = a + (a . b)
            "(+ (nat (nat 'a)) (nat (nat 'b)) (nat 'r) (+ (nat (nat 'a)) (nat 'b) 'r '))"
        );

        // 0 + 0 = 0
        should(
            run.print("?(+ (nat 0) (nat 0) 'r ')")
        ).eql(
            "@(+ @(nat 0) @(nat 0) @(nat 0) ')"
        );

        // 1 + 0 = 1
        should(
            run.print("?(+ (nat (nat 0)) (nat 0) 'r ')")
        ).eql(
            "@(+ @(nat @(nat 0)) @(nat 0) @(nat @(nat 0)) ')"
        );

        // 0 + 1 = 1
        should(
            run.print("?(+ (nat 0) (nat (nat 0)) 'r ')")
        ).eql(
            "@(+ @(nat 0) @(nat @(nat 0)) @(nat @(nat 0)) ')"
        );

        // 2 + 3 = 5
        should(
            run.print("?(+ (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) 'r ')")
        ).eql(
            "@(+ @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat 0)))) @(nat @(nat @(nat @(nat @(nat @(nat 0)))))) @(+ @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat 0))))) @(+ @(nat @(nat @(nat 0))) @(nat @(nat 0)) @(nat @(nat @(nat @(nat 0)))) @(+ @(nat @(nat @(nat 0))) @(nat 0) @(nat @(nat @(nat 0))) '))))"
        );
        
        // 3 + 2 = 5
        should(
            run.print("?(+ (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) 'r ')")
        ).eql(
            "@(+ @(nat @(nat @(nat @(nat 0)))) @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat @(nat 0)))))) @(+ @(nat @(nat @(nat @(nat 0)))) @(nat @(nat 0)) @(nat @(nat @(nat @(nat @(nat 0))))) @(+ @(nat @(nat @(nat @(nat 0)))) @(nat 0) @(nat @(nat @(nat @(nat 0)))) ')))"
        );

        // 2 + 2 = 4
        should(
            run.print("?(+ (nat (nat (nat 0))) (nat (nat (nat 0))) 'r ')")
        ).eql(
            "@(+ @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat 0))))) @(+ @(nat @(nat @(nat 0))) @(nat @(nat 0)) @(nat @(nat @(nat @(nat 0)))) @(+ @(nat @(nat @(nat 0))) @(nat 0) @(nat @(nat @(nat 0))) ')))"
        );
    });

    it('Should declare a mul func', function() {
        this.timeout(1000 * 60 * 5);

        var run = new Z();
        
        run.add(
            // Nat
            "(nat 0)" +
            "(nat (nat 'n))" +

            // Add
            // a . 0 = a,
            "(+ (nat 0) (nat 0) (nat 0) ')" +
            "(+ (nat (nat 'a)) (nat 0) (nat (nat 'a)) ')" +
            "(+ (nat 0) (nat (nat 'a)) (nat (nat 'a)) ')" +

            // a . S(b) = a + (a . b)
            "(+ (nat (nat 'a)) (nat (nat 'b)) (nat 'r) (+ (nat (nat 'a)) (nat 'b) 'r '))" +

            // List
            "(list)" +
            "(list 'item (list ' '))" +
            "(list 'item (list))" +

            // Mul                    
            // a . 0 = 0
            "(* (nat 0) (nat 0) (nat 0) ')" +
            "(* (nat (nat 'a)) (nat 0) (nat 0) ')" +
            "(* (nat 0) (nat (nat 'a)) (nat 0) ')" +

            // a . S(b) = a + (a . b)
            "(* (nat (nat 'a)) (nat (nat 'b)) 'r (list (+ (nat (nat 'a)) 'rm 'r ') (list (* (nat (nat 'a)) (nat 'b) 'rm ') (list))))"
        );

        // 0 * 0 = 0
        should(
            run.print(
                "?(* (nat 0) (nat 0) 'r ')"
            )
        ).eql(
            "@(* @(nat 0) @(nat 0) @(nat 0) ')"
        );


        // 1 * 0 = 0
        should(
            run.print(
                "?(* (nat (nat 0)) (nat 0) 'r ')"
            )
        ).eql(
            "@(* @(nat @(nat 0)) @(nat 0) @(nat 0) ')"
        );

        // 0 * 1 = 0
        should(
            run.print(
                "?(* (nat 0) (nat (nat 0)) 'r ')"
            )
        ).eql(
            "@(* @(nat 0) @(nat @(nat 0)) @(nat 0) ')"
        );

        // 1 * 1 = 1
        should(
            run.print(
                "?(* (nat (nat 0)) (nat (nat 0)) 'r ')"
            )
        ).eql(
            "@(* @(nat @(nat 0)) @(nat @(nat 0)) @(nat @(nat 0)) @(list @(+ @(nat @(nat 0)) @(nat 0) @(nat @(nat 0)) ') @(list @(* @(nat @(nat 0)) @(nat 0) @(nat 0) ') @(list))))"
        );

        // 2 * 1 = 1
        should(
            run.print(
                "?(* (nat (nat (nat 0))) (nat (nat 0)) 'r ')"
            )
        ).eql(
            "@(* @(nat @(nat @(nat 0))) @(nat @(nat 0)) @(nat @(nat @(nat 0))) @(list @(+ @(nat @(nat @(nat 0))) @(nat 0) @(nat @(nat @(nat 0))) ') @(list @(* @(nat @(nat @(nat 0))) @(nat 0) @(nat 0) ') @(list))))"
        );

        // 1 * 2 = 2
        should(
            run.print(
                "?(* (nat (nat 0)) (nat (nat (nat 0))) 'r ')"
            )
        ).eql(
            "@(* @(nat @(nat 0)) @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(list @(+ @(nat @(nat 0)) @(nat @(nat 0)) @(nat @(nat @(nat 0))) @(+ @(nat @(nat 0)) @(nat 0) @(nat @(nat 0)) ')) @(list @(* @(nat @(nat 0)) @(nat @(nat 0)) @(nat @(nat 0)) @(list @(+ @(nat @(nat 0)) @(nat 0) @(nat @(nat 0)) ') @(list @(* @(nat @(nat 0)) @(nat 0) @(nat 0) ') @(list)))) @(list))))"
        );

        // 2 * 2 = 4
        should(
            run.print(
                "?(* (nat (nat (nat 0))) (nat (nat (nat 0))) 'r ')"
            )
        ).eql(
            "@(* @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat 0))))) @(list @(+ @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat 0))))) @(+ @(nat @(nat @(nat 0))) @(nat @(nat 0)) @(nat @(nat @(nat @(nat 0)))) @(+ @(nat @(nat @(nat 0))) @(nat 0) @(nat @(nat @(nat 0))) '))) @(list @(* @(nat @(nat @(nat 0))) @(nat @(nat 0)) @(nat @(nat @(nat 0))) @(list @(+ @(nat @(nat @(nat 0))) @(nat 0) @(nat @(nat @(nat 0))) ') @(list @(* @(nat @(nat @(nat 0))) @(nat 0) @(nat 0) ') @(list)))) @(list))))"
        );

        // 2 * 3 = 6
        should(
            run.print(
                "?(* (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) 'r ')"
            )
        ).eql(
            "@(* @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat 0)))) @(nat @(nat @(nat @(nat @(nat @(nat @(nat 0))))))) @(list @(+ @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat 0))))) @(nat @(nat @(nat @(nat @(nat @(nat @(nat 0))))))) @(+ @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat 0)))) @(nat @(nat @(nat @(nat @(nat @(nat 0)))))) @(+ @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat 0))))) @(+ @(nat @(nat @(nat 0))) @(nat @(nat 0)) @(nat @(nat @(nat @(nat 0)))) @(+ @(nat @(nat @(nat 0))) @(nat 0) @(nat @(nat @(nat 0))) '))))) @(list @(* @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat 0))))) @(list @(+ @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat 0))))) @(+ @(nat @(nat @(nat 0))) @(nat @(nat 0)) @(nat @(nat @(nat @(nat 0)))) @(+ @(nat @(nat @(nat 0))) @(nat 0) @(nat @(nat @(nat 0))) '))) @(list @(* @(nat @(nat @(nat 0))) @(nat @(nat 0)) @(nat @(nat @(nat 0))) @(list @(+ @(nat @(nat @(nat 0))) @(nat 0) @(nat @(nat @(nat 0))) ') @(list @(* @(nat @(nat @(nat 0))) @(nat 0) @(nat 0) ') @(list)))) @(list)))) @(list))))"
        );

        // 3 * 2 = 6
        should(
            run.print(
                "?(* (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) 'r ')"
            )
        ).eql(
            "@(* @(nat @(nat @(nat @(nat 0)))) @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat @(nat @(nat 0))))))) @(list @(+ @(nat @(nat @(nat @(nat 0)))) @(nat @(nat @(nat @(nat 0)))) @(nat @(nat @(nat @(nat @(nat @(nat @(nat 0))))))) @(+ @(nat @(nat @(nat @(nat 0)))) @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat @(nat 0)))))) @(+ @(nat @(nat @(nat @(nat 0)))) @(nat @(nat 0)) @(nat @(nat @(nat @(nat @(nat 0))))) @(+ @(nat @(nat @(nat @(nat 0)))) @(nat 0) @(nat @(nat @(nat @(nat 0)))) ')))) @(list @(* @(nat @(nat @(nat @(nat 0)))) @(nat @(nat 0)) @(nat @(nat @(nat @(nat 0)))) @(list @(+ @(nat @(nat @(nat @(nat 0)))) @(nat 0) @(nat @(nat @(nat @(nat 0)))) ') @(list @(* @(nat @(nat @(nat @(nat 0)))) @(nat 0) @(nat 0) ') @(list)))) @(list))))"
        );
    });

    it('Should declare a factorial func', function() {
        this.timeout(1000 * 60 * 5);
        var run = new Z();
        
        run.add(
            // Nat
            // Nat
            "(nat 0)" +
            "(nat (nat 'n))" +

            // Add
            // a . 0 = a,
            "(+ (nat 0) (nat 0) (nat 0) ')" +
            "(+ (nat (nat 'a)) (nat 0) (nat (nat 'a)) ')" +
            "(+ (nat 0) (nat (nat 'a)) (nat (nat 'a)) ')" +

            // a . S(b) = a + (a . b)
            "(+ (nat (nat 'a)) (nat (nat 'b)) (nat 'r) (+ (nat (nat 'a)) (nat 'b) 'r '))" +

            // List
            "(list)" +
            "(list 'item (list ' '))" +
            "(list 'item (list))" +

            // Mul                    
            // a . 0 = 0
            "(* (nat 0) (nat 0) (nat 0) ')" +
            "(* (nat (nat 'a)) (nat 0) (nat 0) ')" +
            "(* (nat 0) (nat (nat 'a)) (nat 0) ')" +

            // a . S(b) = a + (a . b)
            "(* (nat (nat 'a)) (nat (nat 'b)) 'r (list (+ (nat (nat 'a)) 'rm 'r ') (list (* (nat (nat 'a)) (nat 'b) 'rm ') (list))))" +

            // 0! = 1
            "(fac (nat 0) (nat (nat 0)) ')" +
            "(fac (nat (nat 'k)) (nat (nat 'n)) (list (* 'n1 (nat (nat 'k)) (nat (nat 'n)) ') (list (fac (nat 'k) 'n1 ') (list))))"
        );

        // fac(0) = 1
        should(
            run.print(
                "?(fac (nat 0) 'r ')"
            )
        ).eql("@(fac @(nat 0) @(nat @(nat 0)) ')");

        // fac(1) = 1
        should(
            run.print(
                "?(fac (nat (nat 0)) 'r ')"
            )
        ).eql(
            "@(fac @(nat @(nat 0)) @(nat @(nat 0)) @(list @(* @(nat @(nat 0)) @(nat @(nat 0)) @(nat @(nat 0)) @(list @(+ @(nat @(nat 0)) @(nat 0) @(nat @(nat 0)) ') @(list @(* @(nat @(nat 0)) @(nat 0) @(nat 0) ') @(list)))) @(list @(fac @(nat 0) @(nat @(nat 0)) ') @(list))))"
        );

        // fac(2) = 2
        should(
            run.print(
                "?(fac (nat (nat (nat 0))) 'r ')"
            )
        ).eql(
            "@(fac @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(list @(* @(nat @(nat 0)) @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(list @(+ @(nat @(nat 0)) @(nat @(nat 0)) @(nat @(nat @(nat 0))) @(+ @(nat @(nat 0)) @(nat 0) @(nat @(nat 0)) ')) @(list @(* @(nat @(nat 0)) @(nat @(nat 0)) @(nat @(nat 0)) @(list @(+ @(nat @(nat 0)) @(nat 0) @(nat @(nat 0)) ') @(list @(* @(nat @(nat 0)) @(nat 0) @(nat 0) ') @(list)))) @(list)))) @(list @(fac @(nat @(nat 0)) @(nat @(nat 0)) @(list @(* @(nat @(nat 0)) @(nat @(nat 0)) @(nat @(nat 0)) @(list @(+ @(nat @(nat 0)) @(nat 0) @(nat @(nat 0)) ') @(list @(* @(nat @(nat 0)) @(nat 0) @(nat 0) ') @(list)))) @(list @(fac @(nat 0) @(nat @(nat 0)) ') @(list)))) @(list))))"
        );

        // fac(3) = 6
        should(
            run.print(
                "?(fac (nat (nat (nat (nat 0)))) 'r ')"
            )
        ).eql(
            "@(fac @(nat @(nat @(nat @(nat 0)))) @(nat @(nat @(nat @(nat @(nat @(nat @(nat 0))))))) @(list @(* @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat 0)))) @(nat @(nat @(nat @(nat @(nat @(nat @(nat 0))))))) @(list @(+ @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat 0))))) @(nat @(nat @(nat @(nat @(nat @(nat @(nat 0))))))) @(+ @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat 0)))) @(nat @(nat @(nat @(nat @(nat @(nat 0)))))) @(+ @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat 0))))) @(+ @(nat @(nat @(nat 0))) @(nat @(nat 0)) @(nat @(nat @(nat @(nat 0)))) @(+ @(nat @(nat @(nat 0))) @(nat 0) @(nat @(nat @(nat 0))) '))))) @(list @(* @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat 0))))) @(list @(+ @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat 0))))) @(+ @(nat @(nat @(nat 0))) @(nat @(nat 0)) @(nat @(nat @(nat @(nat 0)))) @(+ @(nat @(nat @(nat 0))) @(nat 0) @(nat @(nat @(nat 0))) '))) @(list @(* @(nat @(nat @(nat 0))) @(nat @(nat 0)) @(nat @(nat @(nat 0))) @(list @(+ @(nat @(nat @(nat 0))) @(nat 0) @(nat @(nat @(nat 0))) ') @(list @(* @(nat @(nat @(nat 0))) @(nat 0) @(nat 0) ') @(list)))) @(list)))) @(list)))) @(list @(fac @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(list @(* @(nat @(nat 0)) @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(list @(+ @(nat @(nat 0)) @(nat @(nat 0)) @(nat @(nat @(nat 0))) @(+ @(nat @(nat 0)) @(nat 0) @(nat @(nat 0)) ')) @(list @(* @(nat @(nat 0)) @(nat @(nat 0)) @(nat @(nat 0)) @(list @(+ @(nat @(nat 0)) @(nat 0) @(nat @(nat 0)) ') @(list @(* @(nat @(nat 0)) @(nat 0) @(nat 0) ') @(list)))) @(list)))) @(list @(fac @(nat @(nat 0)) @(nat @(nat 0)) @(list @(* @(nat @(nat 0)) @(nat @(nat 0)) @(nat @(nat 0)) @(list @(+ @(nat @(nat 0)) @(nat 0) @(nat @(nat 0)) ') @(list @(* @(nat @(nat 0)) @(nat 0) @(nat 0) ') @(list)))) @(list @(fac @(nat 0) @(nat @(nat 0)) ') @(list)))) @(list)))) @(list))))"
        );

        /*
        // fac(4) = 24
        should(
            run.print(
                "?(fac (nat (nat (nat (nat (nat 0))))) 'r ')"
            )
        ).eql(
            "(fac (nat (nat (nat (nat (nat 0))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))))))))))))) (list (* (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat 0))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))))))))))))) (list (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat 0)))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat 0))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat 0)) (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat 0) (nat (nat (nat (nat (nat (nat (nat 0))))))) 'x$113))))))))))))))))))) (list (* (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))))))) (list (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat 0)))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat 0))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat 0)) (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat 0) (nat (nat (nat (nat (nat (nat (nat 0))))))) 'x$164))))))))))))) (list (* (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))) (list (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat (nat 0)))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat (nat 0))))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat (nat (nat (nat (nat 0))))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat 0)) (nat (nat (nat (nat (nat (nat (nat (nat 0)))))))) (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat 0) (nat (nat (nat (nat (nat (nat (nat 0))))))) 'x$191))))))) (list (* (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat (nat 0)) (nat (nat (nat (nat (nat (nat (nat 0))))))) (list (+ (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat 0) (nat (nat (nat (nat (nat (nat (nat 0))))))) 'x$200) (list (* (nat (nat (nat (nat (nat (nat (nat 0))))))) (nat 0) (nat 0) 'x$205) (list)))) (list)))) (list)))) (list)))) (list (fac (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat (nat 0))))))) (list (* (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat (nat 0))))))) (list (+ (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (nat (nat (nat (nat (nat (nat (nat 0))))))) (+ (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) (nat (nat (nat (nat (nat (nat 0)))))) (+ (nat (nat (nat 0))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (+ (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat (nat 0)))) (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) 'x$236))))) (list (* (nat (nat (nat 0))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (list (+ (nat (nat (nat 0))) (nat (nat (nat 0))) (nat (nat (nat (nat (nat 0))))) (+ (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat (nat 0)))) (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) 'x$251))) (list (* (nat (nat (nat 0))) (nat (nat 0)) (nat (nat (nat 0))) (list (+ (nat (nat (nat 0))) (nat 0) (nat (nat (nat 0))) 'x$260) (list (* (nat (nat (nat 0))) (nat 0) (nat 0) 'x$265) (list)))) (list)))) (list)))) (list (fac (nat (nat (nat 0))) (nat (nat (nat 0))) (list (* (nat (nat 0)) (nat (nat (nat 0))) (nat (nat (nat 0))) (list (+ (nat (nat 0)) (nat (nat 0)) (nat (nat (nat 0))) (+ (nat (nat 0)) (nat 0) (nat (nat 0)) 'x$284)) (list (* (nat (nat 0)) (nat (nat 0)) (nat (nat 0)) (list (+ (nat (nat 0)) (nat 0) (nat (nat 0)) 'x$293) (list (* (nat (nat 0)) (nat 0) (nat 0) 'x$298) (list)))) (list)))) (list (fac (nat (nat 0)) (nat (nat 0)) (list (* (nat (nat 0)) (nat (nat 0)) (nat (nat 0)) (list (+ (nat (nat 0)) (nat 0) (nat (nat 0)) 'x$313) (list (* (nat (nat 0)) (nat 0) (nat 0) 'x$318) (list)))) (list (fac (nat 0) (nat (nat 0)) 'x$323) (list)))) (list)))) (list)))) (list))))"
        );
        */
    });
});