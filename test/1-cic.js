"use strict";

const test = require("../test-utils/test");

/*
 x – variable, a character or string representing a parameter or mathematical/logical value.
 ( λ x . M ) {\textstyle (\lambda x.M)} – abstraction, function definition ( M {\textstyle M} is a lambda term). The variable x {\textstyle x} becomes bound in the expression.
 ( M   N ) {\displaystyle (M\ N)} – application, applying a function M {\textstyle M} to an argument N {\textstyle N}. M {\textstyle M} and N {\textstyle N} are lambda terms.

The reduction operations include:

    ( λ x . M [ x ] ) → ( λ y . M [ y ] ) {\textstyle (\lambda x.M[x])\rightarrow (\lambda y.M[y])} – α-conversion, renaming the bound variables in the expression. Used to avoid name collisions.
    ( ( λ x . M )   E ) → ( M [ x := E ] ) {\textstyle ((\lambda x.M)\ E)\rightarrow (M[x:=E])} – β-reduction,[b] replacing the bound variables with the argument expression in the body of the abstraction.
 
*/

describe("CIC Tests.", () => {

    /**
     Two proof methods,
        1. make a set, proof property by making some set with explicit property enconded on constraints, make sure set is equal,
        2. make a set, proof property by assuming that it will fail (negation), if negation result is empty then property is true.
        3. make both. 
     */

    /*
        1. Proof by Set Construction: Demonstrates that the constructed set with the property is equivalent to the original set.
            a. We can construct a set with explicit property and proof that is equal to original set,

        2. Proof by Negation: Shows that assuming the negation leads to a contradiction.
            b. assuming that original set has a property, we can proof for all elements by constructing a set with negated 
            property, if negated set is empty it proofs that property holds for all elements of original set. 
            Should we show why it fails ? 

        3. Proof by Induction: Essential for recursively defined sets or structures.
            c. dont know

        4. Proof by Contradiction: Assumes the negation and derives a contradiction.
            d. Same has proof by negation. 

        5. Proof by Cases: Divides the proof into exhaustive, non-overlapping cases.
            e. This can be done by "hand", we divide the problem into subsets and then make the final proof.

        6. Proof by Exhaustion: Checks each element in a finite domain.
            f. This is the default behaviur of the system.

        7. Proof by Construction: Provides an explicit example or algorithm.
            g. don't know

        8. Existential Proofs: Shows the existence of at least one element satisfying the property.
            h. we can make a new set with property and then check if at least has that element.

        9. Uniqueness Proofs: Demonstrates that exactly one element satisfies the property.
            i. same has existential proof but set must have a unique element, or use tecniques like in and not-in 
    */

        

    it("CIC Definitions ",
        test(
            `
                $NAT = {0} union {(nat 'x:$NAT) ...}
                $SUCC = {(succ 'x:$NAT (nat 'x):$NAT) ...}

                # Theorem succ_inj : forall n m : nat, S n = S m -> n = m.
                /* 
                $T_succ_inj = {
                    (succ 'n 'n1):$SUCC | forall 'm. (succ 'm 'n1):$SUCC -> 'm = 'n
                }
                */

                /*
                $T_succ_inj = {
                    (succ 'n 'n1):$SUCC | 
                        |{(succ 'm 'n1):$SUCC | 'r != 'n}| = 0
                }*/

                $T_succ_inj = {
                    'p |
                        {(succ 'n 'n1):$SUCC | (succ 'm 'n1):$SUCC, 'm != 'n}} as 's 
                    | |'s| = 0, 'p = `true`  
                }

                /*
                Theorem succ_inj : forall n m : nat, S n = S m -> n = m.
                Proof.
                intros n m H.
                inversion H.
                reflexivity.
                Qed.
                */

                // TODO: check that |'s| = 1, is a test function, 
                // if we want to limit elements then we should use limit x
                /*
                $T_succ_inj_2 = { 'n:'s |
                    (succ 'n 'n1):$SUCC,
                    's = { 'm:$NAT | (succ 'm 'n1):$SUCC},
                    |'s| = 1
                }
                */

                $T_succ_inj_2 = { (succ 'n:'s 'n1):$SUCC |
                    's = { 'm:$NAT | (succ 'm 'n1):$SUCC},
                    |'s| = 1
                }

                
                @proof $T_succ_inj_2 = $SUCC

                $NAT_ADD = {('a:$NAT + 'b:$NAT = 'c:$NAT) | 
                    ['a = 0 and 'c = 'b] or 
                    ['b = 0 and 'c = 'a] or
                    ['a = (nat 'x) and 'b = (nat 'y) 
                        and ('x + 'y = 'z)
                        and 'c = (nat (nat 'z))
                    ]
                }
            `, [
                {
                    query: `(lambda true)`,
                    results: ["@(lambda true)"]
                },
                {
                    query: `(lambda 'x . (lambda true))`,
                    results: ["@(lambda 'x . @(lambda true))"]
                },
                {
                    query: `(lambda (lambda 'x . 'x) true)`,
                    results: ["@(lambda @(lambda 'x . 'x) true)"]
                }
            ],
            {path: 'dbs/1-cic/1', timeout: 30000}
        )
    );

    it("Theorem Syntax",
        test(
            `
                $NUMBERS = {0 1 2 3 4 5 6 7 8 9}
                $ADD = {('a:$VALUES + 'b:$VALUES) ...}
                $VALUES = $ADD union $NUMBERS

                $EQUAL = {('x = 'x) ...}

                $ADD_COMPUTE = {
                    ('a:$NUMBER = 'a) ...
                }
                union 
                {
                    (('a + 'b):$ADD = 'c) | 
                        ('a = 'a1):$ADD_COMPUTE,
                        ('b = 'b1):$ADD_COMPUTE,
                        'c = 'a + 'b
                }

                theorem $ADD associativity : forall 'a 'b, ('a + 'b):$ADD = ('b + 'a):$ADD [
                    {('a + 'b):$ADD | 
                        (('a + 'b) = 'c):$ADD_COMPUTE,
                        (('b + 'a) = 'c):$ADD_COMPUTE,
                    } = $ADD
                ],
                forall 'a 'b 'c, (('a + 'b) + 'c):$ADD = ('a + ('b + 'c)):$ADD [
                    {('a + 'b) + 'c):$ADD | 
                        (('a + 'b) + 'c) = 'd):$ADD_COMPUTE,
                        (('a + ('b + 'c) = 'd):$ADD_COMPUTE,
                    } = $ADD
                ]

            `, [
                {
                    query: `(lambda true)`,
                    results: ["@(lambda true)"]
                },
                {
                    query: `(lambda 'x . (lambda true))`,
                    results: ["@(lambda 'x . @(lambda true))"]
                },
                {
                    query: `(lambda (lambda 'x . 'x) true)`,
                    results: ["@(lambda @(lambda 'x . 'x) true)"]
                }
            ],
            {path: 'dbs/1-cic/1', timeout: 30000}
        )
    );


    xit("CIC Definitions ",
        test(
            `
                $D_SET = { (DSET 'n 's) | |'s| = 'n }
                $NAT = {(nat 0 0)} union {(nat 'n 'x:$NAT) | 'x = (nat 'm '), 'n = 'm + 1, 'm = 'n - 1}

                $NAT_ADD = {((nat 0 0):$NAT + 'y:$NAT = 'y)}
                    union {('x:$NAT + (nat 0 0):$NAT = 'x)}
                    union {(
                            (nat ' (nat ' 'x)) + (nat ' (nat ' 'y)):$NAT 
                            = (nat ' (nat ' (nat ' (nat 'z)))
                        ) |
                        ('x + 'y = 'z):$NAT_ADD
                    }

                $NAT_SUB = {('x - 'y = 'z) | ('z + 'y = 'x):$NAT_ADD ; ('x + 'z = 'y):$NAT_ADD}

                $NAT_SUCC = {(succ (nat 0 0) (nat 1 (nat 0 0)))} union {
                    (succ (nat 'n (nat 'm 'x)) (nat 'n1 (nat 'n (nat 'm 'x)))
                    | 'n1 = 'n + 1
                }

                $TC = {(TC ('x + 'y = 'z):NAT_ADD) | ('y + 'x = 'z):NAT_ADD}

                $TC_BASE = {(TC ((nat 0 0) + 'y = 'z)):$TC ...}
                $TC_INDUCTIVE = {(TC ('x + 'y = 'z)):$TC | 
                    (succ 'w 'x):$NAT_SUCC,
                    ('w + 'y = 'a):$NAT_ADD,
                    (succ 'a 'z):$NAT_SUCC
                }

                $TC_PROOF = { {'a$TC_BASE 'b$:TC_INDUCTIVE } | 
                    |'a| > 0, |'b| > 0
                }

            `, [
                {
                    query: `(lambda true)`,
                    results: ["@(lambda true)"]
                },
                {
                    query: `(lambda 'x . (lambda true))`,
                    results: ["@(lambda 'x . @(lambda true))"]
                },
                {
                    query: `(lambda (lambda 'x . 'x) true)`,
                    results: ["@(lambda @(lambda 'x . 'x) true)"]
                }
            ],
            {path: 'dbs/1-lambda/1', timeout: 30000}
        )
    );

});

