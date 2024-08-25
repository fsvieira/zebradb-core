"use strict";

const test = require("../test-utils/test");

// $SET_EXCEPT = {('S / 'U = 'su) | 'su = {'s:'S | |{'s:'U ...}| = 0 }  
// NOT THE SAME HAS {'s:$S | forall 'u in 'U, 's != 'u} , 

describe("Zebra Proofs", () => {
    xit("Simple Constant", test(`
        $DIGIT = {0 1 2 3 4 5 6 7 8 9}
        $TYPES = {
            (CONSTANT 'c:$DIGIT) ...
        }
    `,
        [
            {
                query: `{(CONSTANT 'x):$TYPES | 'x > 4, 'x < 8}`,
                results: [
                    `{(CONSTANT 5) (CONSTANT 6) (CONSTANT 7)}`
                ]
            },
            {
                query: `{(CONSTANT 1):$TYPES ...}`,
                results: [
                    `{(CONSTANT 1)}`
                ]
            },
            {
                query: `{(CONSTANT 10):$TYPES ...}`,
                results: [
                    `{}`
                ]
            }
        ], 
        {
            path: 'dbs/1-z-proofs/types', 
            timeout: 1000 * 60 * 60,
            log: true
        }
    ));

    xit ("Constants Unify", test (`
        $TYPES = {
            (CONSTANT 'c) ...
        }

        $UNIFY_CONSTANT = {((CONSTANT 'c):$TYPES unify (CONSTANT 'c):$TYPES -> (CONSTANT 'c):$TYPES) ...}
    `,
        [
            {
                query: `{((CONSTANT 'c) unify (CONSTANT 'c) -> (CONSTANT 1)):$UNIFY_CONSTANT ... }`,
                results: [
                    `{((CONSTANT 1) -> (CONSTANT 1) -> (CONSTANT 1))}`
                ]
            },
            {
                query: `{((CONSTANT 2) unify (CONSTANT 'c) -> (CONSTANT 1)):$UNIFY_CONSTANT ... }`,
                results: [`{}`]
            },
            {
                query: `{
                    ((CONSTANT 'a) unify (CONSTANT 'b) -> (CONSTANT 'c)):$UNIFY_CONSTANT 
                    | 'a != 'b ; 'a != 'c ; 'b != 'c
                }`,
                results: [`{}`]
            }
        ], 
        {
            path: 'dbs/1-z-proofs/unify', 
            timeout: 1000 * 60 * 60,
            log: true
        }
    ));

    xit ("Constants Unify Proofs (1)", test (`
        $TYPES = {
            (CONSTANT 'c) ...
        }

        $UNIFY_CONSTANT = {((CONSTANT 'c):$TYPES unify (CONSTANT 'c):$TYPES -> (CONSTANT 'c):$TYPES) ...}
    `,
        [
            {
                query: `{ 'v | 
                    's = {
                        ((CONSTANT 'a) unify (CONSTANT 'b) -> (CONSTANT 'c)):$UNIFY_CONSTANT | 
                        'a != 'b ; 'a != 'c ; 'b != 'c
                    } 
                    and 'v = |'s| = 0 
                }`,
                results: [
                    `{0}`
                ]
            }
        ], 
        {
            path: 'dbs/1-z-proofs/proof', 
            timeout: 1000 * 60 * 60,
            log: true
        }
    ));

    xit ("Constants Unify Proposition", test (`
        $TYPES = {
            (CONSTANT 'c) ...
        }

        $UNIFY_CONSTANT = {((CONSTANT 'c):$TYPES unify (CONSTANT 'c):$TYPES -> (CONSTANT 'c):$TYPES) ...}

        # Proposition : A proposition is a statement that is proven to be true, but it is generally considered less significant than a theorem.
        /*
        Proposition $UNIFY_CONSTANT correctness : «Unify Constant is correct»
        [
            {
                ((CONSTANT 'a):$TYPES unify (CONSTANT 'b):$TYPES -> (CONSTANT 'c):$TYPES) 
                ...
            } = $UNIFY_CONSTANT 

            and

            's = {
                ((CONSTANT 'a):$TYPES unify (CONSTANT 'b):$TYPES -> (CONSTANT 'c):$TYPES) | 
                'a != 'b ; 'a != 'c ; 'b != 'c
            } 
            and |'s| = 0
        ]*/
    `,
        [
            {
                query: `
                    Proposition $UNIFY_CONSTANT correctness : «Unify Constant is correct»
                    [
                        's = {
                            ((CONSTANT 'a) unify (CONSTANT 'b) -> (CONSTANT 'c)):$UNIFY_CONSTANT | 
                            'a != 'b ; 'a != 'c ; 'b != 'c
                        } 
                        and |'s| = 0
                    ]
                `,
                results: [
                    `Proposition $UNIFY_CONSTANT correctness is true`
                ]
            },
            /*{
                query: `
                    Proposition $UNIFY_CONSTANT correctness : «Unify Constant is correct»
                    [
                        {
                            ((CONSTANT 'ua) unify (CONSTANT 'ub) -> (CONSTANT 'uc)):$UNIFY_CONSTANT 
                            ...
                        } = $UNIFY_CONSTANT 

                        and

                        's = {
                            ((CONSTANT 'a) unify (CONSTANT 'b) -> (CONSTANT 'c)):$UNIFY_CONSTANT | 
                            'a != 'b ; 'a != 'c ; 'b != 'c
                        } 
                        and |'s| = 0
                    ]
                `,
                results: [
                    `Proposition $UNIFY_CONSTANT correctness is true`
                ]
            }*/
        ], 
        {
            path: 'dbs/1-z-proofs/proposition', 
            timeout: 1000 * 60 * 60,
            log: true
        }
    ));

    it('Set difference (1)', test (`
        $S = {('x = 'x) ...}
        $U = {('x = 'y) ...}

        # $SET_DIFF = {('S / 'U = 'su) | 'su = {'s:'S | |{'s:'U ...}| = 0 }

        `,
        [
            /*{
                query: `
                    {('x = 'y):$S | 'x != 'y }
                `,
                results: [
                    `{}`
                ]
            },
            {
                query: `
                    {('x = 'y):$S ... }
                `,
                results: [
                    `{('x = 'x)}`
                ]
            },
            {
                query: `
                    {('x = 'y):$U | 'x != 'y }
                `,
                results: [
                    `{('x = 'y)}`
                ]
            },
            {
                query: `
                    {('x = 'y):$U | 'x = 'y }
                `,
                results: [
                    `{('y = 'y)}`
                ]
            },*/
            {
                query: `
                    {('x = 'y):$U | 'su = {('x = 'y):$S | 'x != 'y } and |'su| = 0}
                `,
                results: [
                    `{}`
                ]
            }/*,
            {
                query: `
                    {('x = 'y):$U | 'su = {('x = 'y):$S | 'x != 'y }, |'su| = 0}
                `,
                results: [
                    `{('x = 'y)}`
                ]
            }*/
        ], 
        {
            path: 'dbs/1-z-proofs/set-difference', 
            timeout: 1000 * 60 * 60,
            log: true
        }
    ));

    xit("Ordered Sets", test(`
        $LESS_CONSTANT = {
            ((CONSTANT 'a) < (CONSTANT 'b)) |  'a < 'b
        }

        $LESS_TUPLE = {
            ((CONSTANT 'a) < (CONSTANT 'b)) |  'a < 'b
        }

        ...
    `,
    [
        {
            query: `{(CONSTANT 1):$TYPES (CONSTANT 2):$TYPES}`,
            results: [
                "@(2 = 1 + 1)" 
            ]
        }
    ], 
    {
        path: 'dbs/1-z-proofs/unify-types', 
        timeout: 1000 * 60 * 60,
        log: true
    }
    ));

	xit("Unify Types", test(`
            $TUPLE_BODY = {nil (0 'e:$TYPES nil) ...} union {('n 'e:$TYPES ('n1 ' '):$TUPLES_BODY) | 'n > 0 and 'n1 = 'n - 1, 'n = 'n1 + 1}

            $TYPES = {
                (CONSTANT 'c) 
                (SET 's) 
                (TUPLE 'n 't:$TUPLE_BODY) 
                (VARIABLE 'v)
            }


            $UNIFY_CONSTANT = {((CONSTANT 'c):$TYPES unify (CONSTANT 'c):$TYPES -> (CONSTANT 'c)):$TYPES ...}
            $UNIFY_VARIABLE = {((VARIABLE 'v):$TYPES unify 'e:$TYPES -> 'e) ('e1:$TYPES unify (VARIABLE 'v1):$TYPES -> 'e1) ...}

            $UNIFY_TUPLE_BODY = {
            	((0 'e1 'ts1):$TUPLE_BODY unify (0 'e2 nil):$TUPLE_BODY -> (0 'e3 'nil)) | 
                	('e1 unify 'e2 -> 'e3) in $UNIFY
            }
            union {(('n 'e1 'ts1):$TUPLE_BODY unify ('n 'e2 'ts2):$TUPLE_BODY -> ('n 'e3 'ts3)) | 
                'n > 0,
                ('e1 unify 'e2 -> 'e3) in $UNIFY,
                ('ts1 unify 'ts2 -> 'ts3) in $UNIF_TUPLE_BODY
            }

            $UNIFY_TUPLE = {((TUPLE 'n 't1):$TYPES unify (TUPLE 'n 't2):$TYPES -> (TUPLE 'n 't3):$TYPES ) | 
                ('t1 unify 't2 -> 't3) in $UNIFY_TUPLE_BODY
            }

            /**
                Notes:
                    unify two sets will make only one set, to deal 
                    with diferent variable combinations we can use domains to that variables,
                    ex. {x y z} = {a b c}
                    {a b c} , a in {x y z}, b in {x y z}, c in {x y z}, 
                        since there is no repeated elements on set, if (a = x) then b != a and b != x and b in {x y}
            */
            
            $UNIFY_SET = {
                ((SET 's1) unify (SET 's2) -> (SET 's3)) | 
                    'noUnifyA = {'a:'s1 | 'sa = {'b:'s2 | ('a unify  'b -> ') in $UNIFY}, |'sa| = 0},
                    'noUnifyB = {'b:'s2 | 'sb = {'a:'s1 | ('a unify 'b -> ') in $UNIFY}, |'sb| = 0},
                    |'notUnifyA| = 0,
                    |'notUnifyB| = 0,
                    's3 = {'u | ('a:'s1 unify 'b:'s2 -> 'u) in $UNIFY}
            }

            $UNIFY = $UNIFY_CONSTANT union $UNIFY_VARIABLE union $UNIFY_TUPLE union $UNIFY_SET
          
            $UNIQUE_ELEMENT = {
                ('e proper-in 's) | 'u = {'a:'s | ('a unify 'e -> 'a):$UNIFY }, |'u| = 1
            }

            $ELEMENT_DEPENDENT_TYPE = {
                ('e:'s 's 'type) | 
                    'u = {'a:'s | ('a unify 'e -> 'a):$UNIFY }, 
                    [
                        [|'u| = 1 , 'type = (proper-in 's)] ; 
                        [|'u| > 1 , 'type = (in 's)] 
                    ]
            }

            $PROPER_SUBSET = {
                ('a proper-subset 'b) | {
                    'a subset 'b,
                    'e in 'b and 'e not-in 'a
                }
            }

            /*
            $IN = {
                ('a in (SET 's)) | ('a unify 'b:'s -> 'u:'s) in $UNIFY
            }
            union {
                ('a in (VARIABLE 'v)) | 'v = (SET 's) in $TYPES, 's = {'a ...}
            }*/
            
        `,
		[
			{
				query: `{(CONSTANT 1):$TYPES (CONSTANT 2):$TYPES}`,
				results: [
					"@(2 = 1 + 1)" 
				]
			}
		], 
		{
			path: 'dbs/1-z-proofs/unify-types', 
			timeout: 1000 * 60 * 60,
			log: true
		}
	));

});

