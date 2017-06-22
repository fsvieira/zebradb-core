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

    it('Should declare a add func',
        test(
            "(nat 0)" +
            "(nat (nat 'n))" +

            // a . 0 = a,
            "(+ (nat 0) (nat 0) (nat 0) ')" +
            "(+ (nat (nat 'a)) (nat 0) (nat (nat 'a)) ')" +
            "(+ (nat 0) (nat (nat 'a)) (nat (nat 'a)) ')" +

            // a . S(b) = a + (a . b)
            "(+ (nat (nat 'a)) (nat (nat 'b)) (nat 'r) (+ (nat (nat 'a)) (nat 'b) 'r '))" +

            // 0 + 0 = 0
            "?(+ (nat 0) (nat 0) 'r ')" +

            // 1 + 0 = 1
            "?(+ (nat (nat 0)) (nat 0) 'r ')" +

            // 0 + 1 = 1
            "?(+ (nat 0) (nat (nat 0)) 'r ')" +
        
            // 2 + 3 = 5
            "?(+ (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) 'r ')" +

            // 3 + 2 = 5
            "?(+ (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) 'r ')" +

            // 2 + 2 = 4
            "?(+ (nat (nat (nat 0))) (nat (nat (nat 0))) 'r ')"
            ,
            `?(+ (nat 0) (nat 0) 'r '):
                @(+ @(nat 0) @(nat 0) @(nat 0) ')
            ?(+ (nat (nat 0)) (nat 0) 'r '):
                @(+ @(nat @(nat 0)) @(nat 0) @(nat @(nat 0)) ')
            ?(+ (nat 0) (nat (nat 0)) 'r '):
                @(+ @(nat 0) @(nat @(nat 0)) @(nat @(nat 0)) ')
            ?(+ (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) 'r '):
                @(+ @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat 0)))) @(nat @(nat @(nat @(nat @(nat @(nat 0)))))) @(+ @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat 0))))) @(+ @(nat @(nat @(nat 0))) @(nat @(nat 0)) @(nat @(nat @(nat @(nat 0)))) @(+ @(nat @(nat @(nat 0))) @(nat 0) @(nat @(nat @(nat 0))) '))))
            ?(+ (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) 'r '):
                @(+ @(nat @(nat @(nat @(nat 0)))) @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat @(nat 0)))))) @(+ @(nat @(nat @(nat @(nat 0)))) @(nat @(nat 0)) @(nat @(nat @(nat @(nat @(nat 0))))) @(+ @(nat @(nat @(nat @(nat 0)))) @(nat 0) @(nat @(nat @(nat @(nat 0)))) ')))
            ?(+ (nat (nat (nat 0))) (nat (nat (nat 0))) 'r '):
                @(+ @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat 0))))) @(+ @(nat @(nat @(nat 0))) @(nat @(nat 0)) @(nat @(nat @(nat @(nat 0)))) @(+ @(nat @(nat @(nat 0))) @(nat 0) @(nat @(nat @(nat 0))) ')))`
        )
    );

    it('Should declare a mul func',
        test(
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

            // 0 * 0 = 0
            "?(* (nat 0) (nat 0) 'r ')" +

            // 1 * 0 = 0
            "?(* (nat (nat 0)) (nat 0) 'r ')" +

            // 0 * 1 = 0
            "?(* (nat 0) (nat (nat 0)) 'r ')" +

            // 1 * 1 = 1
            "?(* (nat (nat 0)) (nat (nat 0)) 'r ')" +

            // 2 * 1 = 1
            "?(* (nat (nat (nat 0))) (nat (nat 0)) 'r ')" +

            // 1 * 2 = 2
            "?(* (nat (nat 0)) (nat (nat (nat 0))) 'r ')" +
    
            // 2 * 2 = 4
            "?(* (nat (nat (nat 0))) (nat (nat (nat 0))) 'r ')" +

            // 2 * 3 = 6
            "?(* (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) 'r ')" +

            // 3 * 2 = 6
            "?(* (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) 'r ')"
            ,
            `?(* (nat 0) (nat 0) 'r '):
                @(* @(nat 0) @(nat 0) @(nat 0) ')
            ?(* (nat (nat 0)) (nat 0) 'r '):
                @(* @(nat @(nat 0)) @(nat 0) @(nat 0) ')
            ?(* (nat 0) (nat (nat 0)) 'r '):
                @(* @(nat 0) @(nat @(nat 0)) @(nat 0) ')
            ?(* (nat (nat 0)) (nat (nat 0)) 'r '):
                @(* @(nat @(nat 0)) @(nat @(nat 0)) @(nat @(nat 0)) @(list @(+ @(nat @(nat 0)) @(nat 0) @(nat @(nat 0)) ') @(list @(* @(nat @(nat 0)) @(nat 0) @(nat 0) ') @(list))))
            ?(* (nat (nat (nat 0))) (nat (nat 0)) 'r '):
                @(* @(nat @(nat @(nat 0))) @(nat @(nat 0)) @(nat @(nat @(nat 0))) @(list @(+ @(nat @(nat @(nat 0))) @(nat 0) @(nat @(nat @(nat 0))) ') @(list @(* @(nat @(nat @(nat 0))) @(nat 0) @(nat 0) ') @(list))))
            ?(* (nat (nat 0)) (nat (nat (nat 0))) 'r '):
                @(* @(nat @(nat 0)) @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(list @(+ @(nat @(nat 0)) @(nat @(nat 0)) @(nat @(nat @(nat 0))) @(+ @(nat @(nat 0)) @(nat 0) @(nat @(nat 0)) ')) @(list @(* @(nat @(nat 0)) @(nat @(nat 0)) @(nat @(nat 0)) @(list @(+ @(nat @(nat 0)) @(nat 0) @(nat @(nat 0)) ') @(list @(* @(nat @(nat 0)) @(nat 0) @(nat 0) ') @(list)))) @(list))))
            ?(* (nat (nat (nat 0))) (nat (nat (nat 0))) 'r '):
                @(* @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat 0))))) @(list @(+ @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat 0))))) @(+ @(nat @(nat @(nat 0))) @(nat @(nat 0)) @(nat @(nat @(nat @(nat 0)))) @(+ @(nat @(nat @(nat 0))) @(nat 0) @(nat @(nat @(nat 0))) '))) @(list @(* @(nat @(nat @(nat 0))) @(nat @(nat 0)) @(nat @(nat @(nat 0))) @(list @(+ @(nat @(nat @(nat 0))) @(nat 0) @(nat @(nat @(nat 0))) ') @(list @(* @(nat @(nat @(nat 0))) @(nat 0) @(nat 0) ') @(list)))) @(list))))
            ?(* (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) 'r '):
                @(* @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat 0)))) @(nat @(nat @(nat @(nat @(nat @(nat @(nat 0))))))) @(list @(+ @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat 0))))) @(nat @(nat @(nat @(nat @(nat @(nat @(nat 0))))))) @(+ @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat 0)))) @(nat @(nat @(nat @(nat @(nat @(nat 0)))))) @(+ @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat 0))))) @(+ @(nat @(nat @(nat 0))) @(nat @(nat 0)) @(nat @(nat @(nat @(nat 0)))) @(+ @(nat @(nat @(nat 0))) @(nat 0) @(nat @(nat @(nat 0))) '))))) @(list @(* @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat 0))))) @(list @(+ @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat 0))))) @(+ @(nat @(nat @(nat 0))) @(nat @(nat 0)) @(nat @(nat @(nat @(nat 0)))) @(+ @(nat @(nat @(nat 0))) @(nat 0) @(nat @(nat @(nat 0))) '))) @(list @(* @(nat @(nat @(nat 0))) @(nat @(nat 0)) @(nat @(nat @(nat 0))) @(list @(+ @(nat @(nat @(nat 0))) @(nat 0) @(nat @(nat @(nat 0))) ') @(list @(* @(nat @(nat @(nat 0))) @(nat 0) @(nat 0) ') @(list)))) @(list)))) @(list))))
            ?(* (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) 'r '):
                @(* @(nat @(nat @(nat @(nat 0)))) @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat @(nat @(nat 0))))))) @(list @(+ @(nat @(nat @(nat @(nat 0)))) @(nat @(nat @(nat @(nat 0)))) @(nat @(nat @(nat @(nat @(nat @(nat @(nat 0))))))) @(+ @(nat @(nat @(nat @(nat 0)))) @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat @(nat 0)))))) @(+ @(nat @(nat @(nat @(nat 0)))) @(nat @(nat 0)) @(nat @(nat @(nat @(nat @(nat 0))))) @(+ @(nat @(nat @(nat @(nat 0)))) @(nat 0) @(nat @(nat @(nat @(nat 0)))) ')))) @(list @(* @(nat @(nat @(nat @(nat 0)))) @(nat @(nat 0)) @(nat @(nat @(nat @(nat 0)))) @(list @(+ @(nat @(nat @(nat @(nat 0)))) @(nat 0) @(nat @(nat @(nat @(nat 0)))) ') @(list @(* @(nat @(nat @(nat @(nat 0)))) @(nat 0) @(nat 0) ') @(list)))) @(list))))`
            ,
            {timeout: 5000}
        )
    );

    it('Should declare a factorial func',
        test(
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
            "(fac (nat (nat 'k)) (nat (nat 'n)) (list (* 'n1 (nat (nat 'k)) (nat (nat 'n)) ') (list (fac (nat 'k) 'n1 ') (list))))" +
        
            // fac(0) = 1
            "?(fac (nat 0) 'r ')" +
            
            // fac(1) = 1
            "?(fac (nat (nat 0)) 'r ')" +
            
            // fac(2) = 2
            "?(fac (nat (nat (nat 0))) 'r ')" +
            
            // fac(3) = 6
            "?(fac (nat (nat (nat (nat 0)))) 'r ')"
        
            // fac(4) = 24
            // "?(fac (nat (nat (nat (nat (nat 0))))) 'r ')"
            ,
            `?(fac (nat 0) 'r '):
                @(fac @(nat 0) @(nat @(nat 0)) ')
            ?(fac (nat (nat 0)) 'r '):
                @(fac @(nat @(nat 0)) @(nat @(nat 0)) @(list @(* @(nat @(nat 0)) @(nat @(nat 0)) @(nat @(nat 0)) @(list @(+ @(nat @(nat 0)) @(nat 0) @(nat @(nat 0)) ') @(list @(* @(nat @(nat 0)) @(nat 0) @(nat 0) ') @(list)))) @(list @(fac @(nat 0) @(nat @(nat 0)) ') @(list))))
            ?(fac (nat (nat (nat 0))) 'r '):
                @(fac @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(list @(* @(nat @(nat 0)) @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(list @(+ @(nat @(nat 0)) @(nat @(nat 0)) @(nat @(nat @(nat 0))) @(+ @(nat @(nat 0)) @(nat 0) @(nat @(nat 0)) ')) @(list @(* @(nat @(nat 0)) @(nat @(nat 0)) @(nat @(nat 0)) @(list @(+ @(nat @(nat 0)) @(nat 0) @(nat @(nat 0)) ') @(list @(* @(nat @(nat 0)) @(nat 0) @(nat 0) ') @(list)))) @(list)))) @(list @(fac @(nat @(nat 0)) @(nat @(nat 0)) @(list @(* @(nat @(nat 0)) @(nat @(nat 0)) @(nat @(nat 0)) @(list @(+ @(nat @(nat 0)) @(nat 0) @(nat @(nat 0)) ') @(list @(* @(nat @(nat 0)) @(nat 0) @(nat 0) ') @(list)))) @(list @(fac @(nat 0) @(nat @(nat 0)) ') @(list)))) @(list))))
            ?(fac (nat (nat (nat (nat 0)))) 'r '):
                @(fac @(nat @(nat @(nat @(nat 0)))) @(nat @(nat @(nat @(nat @(nat @(nat @(nat 0))))))) @(list @(* @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat 0)))) @(nat @(nat @(nat @(nat @(nat @(nat @(nat 0))))))) @(list @(+ @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat 0))))) @(nat @(nat @(nat @(nat @(nat @(nat @(nat 0))))))) @(+ @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat 0)))) @(nat @(nat @(nat @(nat @(nat @(nat 0)))))) @(+ @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat 0))))) @(+ @(nat @(nat @(nat 0))) @(nat @(nat 0)) @(nat @(nat @(nat @(nat 0)))) @(+ @(nat @(nat @(nat 0))) @(nat 0) @(nat @(nat @(nat 0))) '))))) @(list @(* @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat 0))))) @(list @(+ @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(nat @(nat @(nat @(nat @(nat 0))))) @(+ @(nat @(nat @(nat 0))) @(nat @(nat 0)) @(nat @(nat @(nat @(nat 0)))) @(+ @(nat @(nat @(nat 0))) @(nat 0) @(nat @(nat @(nat 0))) '))) @(list @(* @(nat @(nat @(nat 0))) @(nat @(nat 0)) @(nat @(nat @(nat 0))) @(list @(+ @(nat @(nat @(nat 0))) @(nat 0) @(nat @(nat @(nat 0))) ') @(list @(* @(nat @(nat @(nat 0))) @(nat 0) @(nat 0) ') @(list)))) @(list)))) @(list)))) @(list @(fac @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(list @(* @(nat @(nat 0)) @(nat @(nat @(nat 0))) @(nat @(nat @(nat 0))) @(list @(+ @(nat @(nat 0)) @(nat @(nat 0)) @(nat @(nat @(nat 0))) @(+ @(nat @(nat 0)) @(nat 0) @(nat @(nat 0)) ')) @(list @(* @(nat @(nat 0)) @(nat @(nat 0)) @(nat @(nat 0)) @(list @(+ @(nat @(nat 0)) @(nat 0) @(nat @(nat 0)) ') @(list @(* @(nat @(nat 0)) @(nat 0) @(nat 0) ') @(list)))) @(list)))) @(list @(fac @(nat @(nat 0)) @(nat @(nat 0)) @(list @(* @(nat @(nat 0)) @(nat @(nat 0)) @(nat @(nat 0)) @(list @(+ @(nat @(nat 0)) @(nat 0) @(nat @(nat 0)) ') @(list @(* @(nat @(nat 0)) @(nat 0) @(nat 0) ') @(list)))) @(list @(fac @(nat 0) @(nat @(nat 0)) ') @(list)))) @(list)))) @(list))))`
            ,
            {timeout: 35000}
        )
    );
});