"use strict";

const {test} = require("../");

describe("Not Tests.", function () {

	it("Simple not",
		test(
			`(equal 'x 'x) (blue)
            ?('x ^(equal 'x yellow))`,

			`?('x)[^(equal 'x yellow)]:
                @(blue)[^!(equal blue yellow)]`
		)
	);

	it("Simple not, no constants",
		test(
			`(equal 'x 'x) ('x)
            ?('x ^(equal 'x yellow))`,

			`?('x)[^(equal 'x yellow)]:
                <empty>`
		)
	);

	it("Not evaluation order",
		test(
			`(equal 'x 'x) ('x)
            ?(equal ('x) (yellow) ^(equal ('x) (blue)))`,

			`?(equal ('x) (yellow))[^(equal ('x) (blue))]:
                @(equal @(yellow) @(yellow))[^!(equal (yellow) (blue))]
            `
		)
	);

	it("Declare a not equal",
		test(
			`(color 'a) (equal 'x 'x) (not-equal 'x 'y ^(equal 'x 'y))
            ?(equal yellow yellow)
            ?(equal yellow blue)
            ?(not-equal yellow yellow)
            ?(not-equal yellow blue)
            ?(not-equal (color yellow) (color yellow))
            ?(not-equal (color blue) (color yellow))`,

			`
            ?(equal yellow yellow):
                @(equal yellow yellow)
            ?(equal yellow blue):
                <empty>
            ?(not-equal yellow yellow):
                <empty>
            ?(not-equal yellow blue):
                @(not-equal yellow blue)[^!(equal yellow blue)]
            ?(not-equal (color yellow) (color yellow)):
                <empty>
            ?(not-equal (color blue) (color yellow)):
                @(not-equal @(color blue) @(color yellow))
                    [^!(equal (color blue) (color yellow))]
            `
		)
	);

	it("Should make distinct tuples",
		test(
			`(color yellow)
            (color blue)
            (color red)
            (equal 'x 'x)
            (distinct 'x 'y ^(equal 'x 'y))
            ?(distinct (color yellow) (color yellow))
            ?(distinct (color yellow) (color blue))
            ?(distinct (color 'a) (color 'b))`,

			`?(distinct (color yellow) (color yellow)):
                <empty>
            ?(distinct (color yellow) (color blue)):
                @(distinct @(color yellow) @(color blue))[
                    ^!(equal (color yellow) (color blue))
                ]
            ?(distinct (color 'a) (color 'b)):
                @(distinct @(color blue) @(color red))[
                    ^!(equal (color blue) (color red))
                ]

                @(distinct @(color blue) @(color yellow))[
                    ^!(equal (color blue) (color yellow))
                ]

                @(distinct @(color red) @(color blue))[
                    ^!(equal (color red) (color blue))
                ]

                @(distinct @(color red) @(color yellow))[
                    ^!(equal (color red) (color yellow))
                ]

                @(distinct @(color yellow) @(color blue))[
                    ^!(equal (color yellow) (color blue))
                ]

                @(distinct @(color yellow) @(color red))[
                    ^!(equal (color yellow) (color red))
                ]
            `
		)
	);

	it("Should declare simple not.",
		test(
			`(number 0)
            (number 1)
            (not 'x 'y ^(equal 'x 'y))
            (equal 'x 'x)
            ?(not (number 'p) (number 'q))`,

			`?(not (number 'p) (number 'q)):
                @(not @(number 0) @(number 1))[^!(equal (number 0) (number 1))]
                @(not @(number 1) @(number 0))[^!(equal (number 1) (number 0))]
            `
		)
	);

	it("Should declare a list",
		test(
			`(list)
            (list 'item (list ' '))
            (list 'item (list))

            (fruit banana)
            (fruit strawberry)
            (fruit apple)
            (fruit papaya)

            (equal 'x 'x)
            ?(list)
            ?(list (fruit banana) (list (fruit apple) (list)))
            ?(list (fruit 'a) (list (fruit 'b) (list)) ^(equal 'a 'b))`,

			`?(list):
                @(list)
            ?(list (fruit banana) (list (fruit apple) (list))):
                @(list @(fruit banana) @(list @(fruit apple) @(list)))
            ?(list (fruit 'a) (list (fruit 'b) (list)))[^(equal 'a 'b)]:
                @(list @(fruit apple) @(list @(fruit banana) @(list)))
                    [^!(equal apple banana)]

                @(list @(fruit apple) @(list @(fruit papaya) @(list)))
                    [^!(equal apple papaya)]

                @(list @(fruit apple) @(list @(fruit strawberry) @(list)))
                    [^!(equal apple strawberry)]

                @(list @(fruit banana) @(list @(fruit apple) @(list)))
                    [^!(equal banana apple)]

                @(list @(fruit banana) @(list @(fruit papaya) @(list)))
                    [^!(equal banana papaya)]

                @(list @(fruit banana) @(list @(fruit strawberry) @(list)))
                    [^!(equal banana strawberry)]

                @(list @(fruit papaya) @(list @(fruit apple) @(list)))
                    [^!(equal papaya apple)]

                @(list @(fruit papaya) @(list @(fruit banana) @(list)))
                    [^!(equal papaya banana)]

                @(list @(fruit papaya) @(list @(fruit strawberry) @(list)))
                    [^!(equal papaya strawberry)]

                @(list @(fruit strawberry) @(list @(fruit apple) @(list)))
                    [^!(equal strawberry apple)]

                @(list @(fruit strawberry) @(list @(fruit banana) @(list)))
                    [^!(equal strawberry banana)]

                @(list @(fruit strawberry) @(list @(fruit papaya) @(list)))
                    [^!(equal strawberry papaya)]`
		)
	);

	it("Should declare a two number Set",
		test(
			`(number 0)
            (number 1)
            (set)
            (set (number 'a) (set) ')
            (set (number 'a) (set (number 'b) 'tail ') (set (number 'a) 'tail ')
                ^(equal (number 'a) (number 'b))
            )

            (equal 'x 'x)

            number:
                (number 'n) -> 'n.

            set:
                (set 'i (set) ') -> "" 'i | number,
                (set 'i 'tail ') -> "" 'i | number ", " 'tail | set,
                (set) -> "".

            setStart:
                (set 'i (set) ') -> "[" 'i | number "]\n",
                (set 'i 'tail ') -> "[" 'i | number ", " 'tail | set "]\n".

            ?(set (number 'a) (set (number 'b) (set) ') ') | setStart
            ?(set (number 'a)
                (set (number 'b)
                (set (number 'c) (set) ') ')
            ') | setStart
            `,

			`
            ?(set (number 'a) (set (number 'b) (set) ') '$1):
                [0, 1]
                [1, 0]

            ?(set (number 'a)
                (set (number 'b)
                (set (number 'c) (set) ') '$1) '$2
            ):
                <empty>
            `

		)
	);

	it("Should declare a two number Set, query all",
		test(
			`(number 0)
            (number 1)
            (set)
            (set (number 'a) (set) ')
            (set (number 'a) (set (number 'b) 'tail ') (set (number 'a) 'tail ')
                ^(equal (number 'a) (number 'b))
            )

            (equal 'x 'x)

            number:
                (number 'n) -> 'n.

            set:
                (set 'i (set) ') -> "" 'i | number,
                (set 'i 'tail ') -> "" 'i | number ", " 'tail | set,
                (set) -> "".

            setStart:
                (set 'i (set) ') -> "[" 'i | number "]\n",
                (set 'i 'tail ') -> "[" 'i | number ", " 'tail | set "]\n".

            ?(set (number 'a) 'tail ') | setStart
            `,

			`?(set (number 'a) 'tail '):
                [0,1]
                [0]
                [1,0]
                [1]
            `
		)
	);

	it("Should declare a number Set, 3 elements",
		test(
			`(number 0)
            (number 1)
            (number 2)
            (set)
            (set (number 'a) (set) ')
            (set (number 'a) (set (number 'b) 'tail ') (set (number 'a) 'tail ')
                ^(equal (number 'a) (number 'b))
            )

            (equal 'x 'x)

            number:
                (number 'n) -> 'n.

            set:
                (set 'i (set) ') -> "" 'i | number,
                (set 'i 'tail ') -> "" 'i | number ", " 'tail | set,
                (set) -> "".

            setStart:
                (set 'i (set) ') -> "[" 'i | number "]\n",
                (set 'i 'tail ') -> "[" 'i | number ", " 'tail | set "]\n".

            ?(set (number 0)
                (set (number 1)
                (set (number 2) (set) ') ')
            ') | setStart

            ?(set (number 'a) 'tail ') | setStart
            `,

			`?(set (number 0)
                (set (number 1)
                (set (number 2) (set) ') '$1) '$2
            ):
            	[0, 1, 2]

            ?(set (number 'a) 'tail '):
                [0,1,2]
                [0,1]
                [0,2,1]
                [0,2]
                [0]
                [1,0,2]
                [1,0]
                [1,2,0]
                [1,2]
                [1]
                [2,0,1]
                [2,0]
                [2,1,0]
                [2,1]
                [2]
            `, { timeout: 60000 }
		)
	);

	it("Should declare a number Set, 4 elements",
		test(
			`(number 0)
            (number 1)
            (number 2)
            (number 3)
            (set)
            (set (number 'a) (set) ')
            (set (number 'a)
                (set (number 'b) 'tail ')
                (set (number 'a) 'tail ')
                ^(equal (number 'a) (number 'b))
            )

            (equal 'x 'x)

            number:
                (number 'n) -> 'n.

            set:
                (set 'i (set) ') -> "" 'i | number,
                (set 'i 'tail ') -> "" 'i | number ", " 'tail | set,
                (set) -> "".

            setStart:
                (set 'i (set) ') -> "[" 'i | number "]\n",
                (set 'i 'tail ') -> "[" 'i | number ", " 'tail | set "]\n".

            ?(set (number 0)
                (set (number 1)
                (set (number 2)
                (set (number 3) (set) ') ') ')
            ') | setStart

            ?(set (number 'a)
                (set (number 'b)
                (set (number 'c)
                (set (number 'd) (set) ') ') ')
            ') | setStart
            `,

			`
            ?(set (number 0)
                (set (number 1)
                (set (number 2)
                (set (number 3) (set) ') '$1) '$2) '$3
            ):
            	[0, 1, 2, 3]

            ?(set
                (number 'a)
                (set (number 'b)
                (set (number 'c)
                (set (number 'd) (set) ') '$1) '$2) '$3
            ):
                [0,1,2,3]
                [0,1,3,2]
                [0,2,1,3]
                [0,2,3,1]
                [0,3,1,2]
                [0,3,2,1]
                [1,0,2,3]
                [1,0,3,2]
                [1,2,0,3]
                [1,2,3,0]
                [1,3,0,2]
                [1,3,2,0]
                [2,0,1,3]
                [2,0,3,1]
                [2,1,0,3]
                [2,1,3,0]
                [2,3,0,1]
                [2,3,1,0]
                [3,0,1,2]
                [3,0,2,1]
                [3,1,0,2]
                [3,1,2,0]
                [3,2,0,1]
                [3,2,1,0]
            `, { timeout: 60000 * 2 }
		)
	);

	it("Should declare a number Set, 4 elements, all",
		test(
			`(number 0)
            (number 1)
            (number 2)
            (number 3)
            (set)
            (set (number 'a) (set) ')
            (set (number 'a)
                (set (number 'b) 'tail ')
                (set (number 'a) 'tail ')
                ^(equal (number 'a) (number 'b))
            )

            (equal 'x 'x)

            number:
                (number 'n) -> 'n.

            set:
                (set 'i (set) ') -> "" 'i | number,
                (set 'i 'tail ') -> "" 'i | number ", " 'tail | set,
                (set) -> "".

            setStart:
                (set 'i (set) ') -> "[" 'i | number "]\n",
                (set 'i 'tail ') -> "[" 'i | number ", " 'tail | set "]\n".

            ?(set (number 'a) 'tail ') | setStart
            `,

			`?(set (number 'a) 'tail '):
                [0,1,2,3]
                [0,1,2]
                [0,1,3,2]
                [0,1,3]
                [0,1]
                [0,2,1,3]
                [0,2,1]
                [0,2,3,1]
                [0,2,3]
                [0,2]
                [0,3,1,2]
                [0,3,1]
                [0,3,2,1]
                [0,3,2]
                [0,3]
                [0]
                [1,0,2,3]
                [1,0,2]
                [1,0,3,2]
                [1,0,3]
                [1,0]
                [1,2,0,3]
                [1,2,0]
                [1,2,3,0]
                [1,2,3]
                [1,2]
                [1,3,0,2]
                [1,3,0]
                [1,3,2,0]
                [1,3,2]
                [1,3]
                [1]
                [2,0,1,3]
                [2,0,1]
                [2,0,3,1]
                [2,0,3]
                [2,0]
                [2,1,0,3]
                [2,1,0]
                [2,1,3,0]
                [2,1,3]
                [2,1]
                [2,3,0,1]
                [2,3,0]
                [2,3,1,0]
                [2,3,1]
                [2,3]
                [2]
                [3,0,1,2]
                [3,0,1]
                [3,0,2,1]
                [3,0,2]
                [3,0]
                [3,1,0,2]
                [3,1,0]
                [3,1,2,0]
                [3,1,2]
                [3,1]
                [3,2,0,1]
                [3,2,0]
                [3,2,1,0]
                [3,2,1]
                [3,2]
                [3]
            `, { timeout: 60000 * 5 }
		)
	);
});
