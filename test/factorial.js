"use strict";

const {test} = require("../");

describe("Factorial Parser Tests.", function () {
	it("Should declare ~Peanno numbers",
		test(
			`(nat 0)
			(nat (nat 'n))
			?(nat (nat 1))
			?(nat (nat 0))

			decimal:
				(nat 0) -> 0,
				(nat 'n) -> 1 + 'n | decimal.

            ?(nat 'n) | decimal`,

			`?(nat (nat 1)):
                <empty>
            ?(nat (nat 0)):
                @(nat @(nat 0))
            ?(nat 'n):
                0
                1
                2
                3
                4
            `, { depth: 7 }
		)
	);

	it("Should declare a add func",
		test(
			`
            (nat 0)
            (nat (nat 'n))

            # a . 0 = a,
            (+ (nat 0) (nat 0) (nat 0) ')
            (+ (nat (nat 'a)) (nat 0) (nat (nat 'a)) ')
            (+ (nat 0) (nat (nat 'a)) (nat (nat 'a)) ')

            # a . S(b) = a + (a . b)
            (+ (nat (nat 'a)) (nat (nat 'b)) (nat 'r)
                (+ (nat (nat 'a)) (nat 'b) 'r ')
            )

            decimal:
                (nat 0) -> 0,
                (nat 'n) -> 1 + 'n | decimal.

            addResult:
                (+ ' ' 'r ') -> 'r | decimal.

            # 0 + 0 = 0
            ?(+ (nat 0) (nat 0) 'r ') | addResult

            # 1 + 0 = 1
            ?(+ (nat (nat 0)) (nat 0) 'r ') | addResult

            # 0 + 1 = 1
            ?(+ (nat 0) (nat (nat 0)) 'r ') | addResult

            # 2 + 3 = 5
            ?(+ (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) 'r ') | addResult

            # 3 + 2 = 5
            ?(+ (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) 'r ') | addResult

            # 2 + 2 = 4
            ?(+ (nat (nat (nat 0))) (nat (nat (nat 0))) 'r ') | addResult
            `,

			`
            ?(+ (nat 0) (nat 0) 'r '): 0
            ?(+ (nat (nat 0)) (nat 0) 'r '): 1
            ?(+ (nat 0) (nat (nat 0)) 'r '): 1
            ?(+ (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) 'r '): 5
            ?(+ (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) 'r '): 5
            ?(+ (nat (nat (nat 0))) (nat (nat (nat 0))) 'r '): 4
            `
		)
	);

	it("Should declare a mul func",
		test(
			`
            # Nat
            (nat 0)
            (nat (nat 'n))

            # Add
            # a . 0 = a,
            (+ (nat 0) (nat 0) (nat 0) ')
            (+ (nat (nat 'a)) (nat 0) (nat (nat 'a)) ')
            (+ (nat 0) (nat (nat 'a)) (nat (nat 'a)) ')

            # a . S(b) = a + (a . b)
            (+ (nat (nat 'a)) (nat (nat 'b)) (nat 'r)
                (+ (nat (nat 'a)) (nat 'b) 'r ')
            )

            # List
            (list)
            (list 'item (list ' '))
            (list 'item (list))

            # Mul
            # a . 0 = 0
            (* (nat 0) (nat 0) (nat 0) ')
            (* (nat (nat 'a)) (nat 0) (nat 0) ')
            (* (nat 0) (nat (nat 'a)) (nat 0) ')

            # a . S(b) = a + (a . b)
            (* (nat (nat 'a)) (nat (nat 'b)) 'r
                (list (+ (nat (nat 'a)) 'rm 'r ')
                (list (* (nat (nat 'a)) (nat 'b) 'rm ') (list)))
            )

            decimal:
                (nat 0) -> 0,
                (nat 'n) -> 1 + 'n | decimal.

            mulResult:
                (* ' ' 'r ') -> 'r | decimal.

            # 0 * 0 = 0
            ?(* (nat 0) (nat 0) 'r ') | mulResult

            # 1 * 0 = 0
            ?(* (nat (nat 0)) (nat 0) 'r ') | mulResult

            # 0 * 1 = 0
            ?(* (nat 0) (nat (nat 0)) 'r ') | mulResult

            # 1 * 1 = 1
            ?(* (nat (nat 0)) (nat (nat 0)) 'r ') | mulResult

            # 2 * 1 = 2
            ?(* (nat (nat (nat 0))) (nat (nat 0)) 'r ') | mulResult

            # 1 * 2 = 2
            ?(* (nat (nat 0)) (nat (nat (nat 0))) 'r ') | mulResult

            # 2 * 2 = 4
            ?(* (nat (nat (nat 0))) (nat (nat (nat 0))) 'r ') | mulResult

            # 2 * 3 = 6
            ?(* (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) 'r ') | mulResult

            # 3 * 2 = 6
            ?(* (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) 'r ') | mulResult
            `,
			`
            ?(* (nat 0) (nat 0) 'r '): 0
            ?(* (nat (nat 0)) (nat 0) 'r '): 0
            ?(* (nat 0) (nat (nat 0)) 'r '): 0
            ?(* (nat (nat 0)) (nat (nat 0)) 'r '): 1
            ?(* (nat (nat (nat 0))) (nat (nat 0)) 'r '): 2
            ?(* (nat (nat 0)) (nat (nat (nat 0))) 'r '): 2
            ?(* (nat (nat (nat 0))) (nat (nat (nat 0))) 'r '): 4
            ?(* (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) 'r '): 6
            ?(* (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) 'r '): 6
            `, { timeout: 5000 }
		)
	);

	it("Should declare a factorial func",
		test(
			`
            # Nat
            # Nat
            (nat 0)
            (nat (nat 'n))

            # Add
            # a . 0 = a,
            (+ (nat 0) (nat 0) (nat 0) ')
            (+ (nat (nat 'a)) (nat 0) (nat (nat 'a)) ')
            (+ (nat 0) (nat (nat 'a)) (nat (nat 'a)) ')

            # a . S(b) = a + (a . b)
            (+ (nat (nat 'a)) (nat (nat 'b)) (nat 'r)
                (+ (nat (nat 'a)) (nat 'b) 'r ')
            )

            # List
            (list)
            (list 'item (list ' '))
            (list 'item (list))

            # Mul
            # a . 0 = 0
            (* (nat 0) (nat 0) (nat 0) ')
            (* (nat (nat 'a)) (nat 0) (nat 0) ')
            (* (nat 0) (nat (nat 'a)) (nat 0) ')

            # a . S(b) = a + (a . b)
            (* (nat (nat 'a)) (nat (nat 'b)) 'r
                (list (+ (nat (nat 'a)) 'rm 'r ')
                (list (* (nat (nat 'a)) (nat 'b) 'rm ') (list)))
            )

            # 0! = 1
            (fac (nat 0) (nat (nat 0)) ')
            (fac (nat (nat 'k)) (nat (nat 'n))
                (list (* 'n1 (nat (nat 'k)) (nat (nat 'n)) ')
                (list (fac (nat 'k) 'n1 ') (list)))
            )

            decimal:
                (nat 0) -> 0,
                (nat 'n) -> 1 + 'n | decimal.

            facResult:
                (fac ' 'r ') -> 'r | decimal.

            # fac(0) = 1
            ?(fac (nat 0) 'r ') | facResult

            # fac(1) = 1
            ?(fac (nat (nat 0)) 'r ') | facResult

            # fac(2) = 2
            ?(fac (nat (nat (nat 0))) 'r ') | facResult

            # fac(3) = 6
            ?(fac (nat (nat (nat (nat 0)))) 'r ') | facResult

            # fac(4) = 24
            # ?(fac (nat (nat (nat (nat (nat 0))))) 'r ') | facResult

            `,
			`
            ?(fac (nat 0) 'r '): 1
            ?(fac (nat (nat 0)) 'r '): 1
            ?(fac (nat (nat (nat 0))) 'r '): 2
            ?(fac (nat (nat (nat (nat 0)))) 'r '): 6
            `, { timeout: 60000 * 5 }
		)
	);
});
