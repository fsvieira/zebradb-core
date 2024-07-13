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

describe("Lambda Tests.", () => {

    it("Lambda Definitions ",
        test(
            `
                $LAMBDA = {
                    (lambda 'x:$LAMBDA)
                    (lambda 'x:$LAMBDA . 'M:$LAMBDA)
                    (lambda 'M:$LAMBDA 'N:$LAMBDA)
                ... }
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

    it("Lambda Beta Reduction",
        test(
            `
                $LAMBDA = {
                    (lambda 'x:$LAMBDA)
                    (lambda 'x:$LAMBDA . 'M:$LAMBDA)
                    (lambda 'M:$LAMBDA 'N:$LAMBDA)
                ... }


                $LAMBDA_BETA = {
                    (beta (lambda 'x:$LAMBDA) 'x)
                }
                union {
                
                }

                # should reduce it recursive.
                $LAMBDA_BETA = {
                    (beta (lambda 'x:$LAMBDA) 'x)
                    (beta (lambda 'x:$LAMBDA . 'M:$LAMBDA) (lambda 'x:$LAMBDA . 'M:$LAMBDA))
                    (beta 
                       (lambda (lambda 'x . 'M) 'x) 
                        'M
                    )
                    (beta 
                       (lambda (lambda 'x:$LAMBDA) 'y) 
                       (lambda (lambda 'x:$LAMBDA) 'y)
                    )
                       # should reduce it recusive ? 
                    (beta 
                       (lambda (lambda 'M:$LAMBDA 'N:$LAMBDA) 'y) 
                       (lambda (lambda 'M:$LAMBDA 'N:$LAMBDA) 'y)
                    )
                ... }
            `, [
                {
                    query: `(beta (lambda (lambda 'x . 'x) true) 'p)`, 
                    results: ["@(beta @(lambda @(lambda true . true) true) true)"]
                },
                {
                    query: `(beta (lambda 'x . 'x) 'p)`, 
                    results: ["@(beta @(lambda 'x . 'x) @(lambda 'x . 'x))"]
                },
                {
                    query: `(beta (lambda true) 'p)`, 
                    results: ["@(beta @(lambda true) @(lambda true))"]
                },
                {
                    query: `(beta (lambda 'y . (lambda 'x . 'x)) 'p)`, 
                    results: ["@(beta @(lambda 'y . @(lambda 'x . 'x)) @(lambda 'y . @(lambda 'x . 'x)))"]
                }
            ],
            {path: 'dbs/1-lambda/2', timeout: 30000}
        )
    );

    /*
    it("Lambda Definitions ",
        test(
            `
                (lambda 'x)
                (lambda 'x . 'M)
                (lambda 'M 'N)
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
            {path: 'dbs/lambda/1', timeout: 30000}
        )
    );

    it("Lambda Beta Reduction",
        test(
            `
                (lambda 'x)
                (lambda 'x . 'M)
                (lambda 'M 'N)
                (beta 
                    (lambda (lambda 'x . 'M) 'x) 
                    'M
                )
                (beta 
                    (lambda 'x) 
                    (lambda 'x)
                )
                (beta 
                    (lambda 'x . 'M) 
                    (lambda 'x . 'M) 
                )
            `, [
                {
                    query: `(beta (lambda (lambda 'x . 'x) true) 'p)`, 
                    results: ["@(beta @(lambda @(lambda true . true) true) true)"]
                },
                {
                    query: `(beta (lambda 'x . 'x) 'p)`, 
                    results: ["@(beta @(lambda 'x . 'x) @(lambda 'x . 'x))"]
                },
                {
                    query: `(beta (lambda true) 'p)`, 
                    results: ["@(beta @(lambda true) @(lambda true))"]
                },
                {
                    query: `(beta (lambda 'y . (lambda 'x . 'x)) 'p)`, 
                    results: ["@(beta @(lambda 'y . @(lambda 'x . 'x)) @(lambda 'y . @(lambda 'x . 'x)))"]
                }
            ],
            {path: 'dbs/lambda/2', timeout: 30000}
        )
    );*/

});

