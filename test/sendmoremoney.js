"use strict";

const test = require("../test-utils/test");

describe("Send more money puzzle test.", function () {

    xit("should solve send more money",
		test(`
            (adder 0 	0 	0 	0 	0)
            (adder 0 	0 	1 	1 	0)
            (adder 0 	1 	0 	1 	0)
            (adder 0 	1 	1 	0 	1)
            (adder 1 	0 	0 	1 	0)
            (adder 1 	0 	1 	0 	1)
            (adder 1 	1 	0 	0 	1)
            (adder 1 	1 	1 	1 	1)

            (float16 
                'x1 'x2 'x3 'x4 'x5 'x6 'x7 'x8 . 
                'y1 'y2 'y3 'y4 'y5 'y6 'y7 'y8 
            )

            (add-processing 
                ' ' ' ' ' ' ' ' ' '
                ' ' ' ' ' '  
            )

            (0 / 2 = 0 0)
            (1 / 2 = 0 1)
            (2 / 2 = 1 0)
            (3 / 2 = 1 1)
            (4 / 2 = 2 0)
            (5 / 2 = 2 1)
            (6 / 2 = 3 0)
            (7 / 2 = 3 1)
            (8 / 2 = 4 0)
            (9 / 2 = 4 1)

            (
                ('x / 2 = 'y 'z)
                (if-not-zero 'y ('y / 2 = 'a 'b))
            )

            (shift 
                (float16 
                    'x1 'x2 'x3 'x4 'x5 'x6 'x7 'x8 . 
                    'x9 'x10 'x11 'x12 'x13 'x14 'x15 'x16 
                )
                (float16 
                    'x2 'x3 'x4 'x5 'x6 'x7 'x8 'x9 . 
                    'x10 'x11 'x12 'x13 'x14 'x15 'x16 0 
                )
            )

        /*
            s e n d
            m o r e
          ---------
          m o n e y
        */

            (add 
                (float16 
                    'x1 'x2 'x3 'x4 'x5 'x6 'x7 'x8 . 
                    'x9 'x10 'x11 'x12 'x13 'x14 'x15 'x16 
                )
                (float16 
                    'y1 'y2 'y3 'y4 'y5 'y6 'y7 'y8 . 
                    'y9 'y10 'y11 'y12 'y13 'y14 'y15 'y16 
                )
                (float16 
                    'z1 'z2 'z3 'z4 'z5 'z6 'z7 'z8 . 
                    'z9 'z10 'z11 'z12 'z13 'z14 'z15 'z16 
                )
                (
                    add-processing
                    (adder 0 'x16 'y16 'z16 'c1)
                    (adder 'c1 'x15 'y15 'z15 'c2)
                    (adder 'c2 'x14 'y14 'z14 'c3)
                    (adder 'c3 'x13 'y13 'z13 'c4)
                    (adder 'c4 'x12 'y12 'z12 'c5)
                    (adder 'c5 'x11 'y11 'z11 'c6)
                    (adder 'c6 'x10 'y10 'z10 'c7)
                    (adder 'c7 'x9 'y9 'z9 'c8)
                    (adder 'c8 'x8 'y8 'z8 'c9)
                    (adder 'c9 'x7 'y7 'z7 'c10)
                    (adder 'c10 'x6 'y6 'z6 'c11)
                    (adder 'c11 'x5 'y5 'z5 'c12)
                    (adder 'c12 'x4 'y4 'z4 'c13)
                    (adder 'c13 'x3 'y3 'z3 'c14)
                    (adder 'c14 'x2 'y2 'z2 'c15)
                    (adder 'c15 'x1 'y1 'z1 'z0)
                )
            )
        `, 
        [
            {
                query: `(adder 1 1 1 'x 'y)`,
                results: ["@(adder 1 1 1 1 1)"]
            },
            {
                query: `(add 
                    (float16 
                        0 0 0 0 0 0 0 1 . 
                        0 0 0 0 0 0 0 0 
                    )
                    (float16 
                        0 0 0 0 0 0 0 1 . 
                        0 0 0 0 0 0 0 0 
                    )
                    'z
                    '
                )`,
                results: ["@(add @(float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 1 0 . 0 0 0 0 0 0 0 0) @(add-processing @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 1 1 0 1) @(adder 1 0 0 1 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0)))"]
            }
        ], 
        {
            timeout: 60000 * 35,
            path: 'dbs/sendmoremoney/1'
        })
    );

	xit("should solve send more money",
		test(
			`
            # declare list,
            (list)
            (list 'item (list))
            (list 'item (list ' '))

            # declare decimal numbers and add operation,
            # dec is in reverse order, most significant digit is at right

            (dec)
            (dec 0 (dec))
            (dec 1 (dec))
            (dec 2 (dec))
            (dec 3 (dec))
            (dec 4 (dec))
            (dec 5 (dec))
            (dec 6 (dec))
            (dec 7 (dec))
            (dec 8 (dec))
            (dec 9 (dec))

            (dec 0 (dec ' '))
            (dec 1 (dec ' '))
            (dec 2 (dec ' '))
            (dec 3 (dec ' '))
            (dec 4 (dec ' '))
            (dec 5 (dec ' '))
            (dec 6 (dec ' '))
            (dec 7 (dec ' '))
            (dec 8 (dec ' '))
            (dec 9 (dec ' '))

            (0 + 0 + 0 = 0 0)
            (0 + 0 + 1 = 1 0)
            (0 + 1 + 0 = 1 0)
            (0 + 1 + 1 = 2 0)
            (0 + 2 + 0 = 2 0)
            (0 + 2 + 1 = 3 0)
            (0 + 3 + 0 = 3 0)
            (0 + 3 + 1 = 4 0)
            (0 + 4 + 0 = 4 0)
            (0 + 4 + 1 = 5 0)
            (0 + 5 + 0 = 5 0)
            (0 + 5 + 1 = 6 0)
            (0 + 6 + 0 = 6 0)
            (0 + 6 + 1 = 7 0)
            (0 + 7 + 0 = 7 0)
            (0 + 7 + 1 = 8 0)
            (0 + 8 + 0 = 8 0)
            (0 + 8 + 1 = 9 0)
            (0 + 9 + 0 = 9 0)
            (0 + 9 + 1 = 0 1)
            (1 + 0 + 0 = 1 0)
            (1 + 0 + 1 = 2 0)
            (1 + 1 + 0 = 2 0)
            (1 + 1 + 1 = 3 0)
            (1 + 2 + 0 = 3 0)
            (1 + 2 + 1 = 4 0)
            (1 + 3 + 0 = 4 0)
            (1 + 3 + 1 = 5 0)
            (1 + 4 + 0 = 5 0)
            (1 + 4 + 1 = 6 0)
            (1 + 5 + 0 = 6 0)
            (1 + 5 + 1 = 7 0)
            (1 + 6 + 0 = 7 0)
            (1 + 6 + 1 = 8 0)
            (1 + 7 + 0 = 8 0)
            (1 + 7 + 1 = 9 0)
            (1 + 8 + 0 = 9 0)
            (1 + 8 + 1 = 0 1)
            (1 + 9 + 0 = 0 1)
            (1 + 9 + 1 = 1 1)
            (2 + 0 + 0 = 2 0)
            (2 + 0 + 1 = 3 0)
            (2 + 1 + 0 = 3 0)
            (2 + 1 + 1 = 4 0)
            (2 + 2 + 0 = 4 0)
            (2 + 2 + 1 = 5 0)
            (2 + 3 + 0 = 5 0)
            (2 + 3 + 1 = 6 0)
            (2 + 4 + 0 = 6 0)
            (2 + 4 + 1 = 7 0)
            (2 + 5 + 0 = 7 0)
            (2 + 5 + 1 = 8 0)
            (2 + 6 + 0 = 8 0)
            (2 + 6 + 1 = 9 0)
            (2 + 7 + 0 = 9 0)
            (2 + 7 + 1 = 0 1)
            (2 + 8 + 0 = 0 1)
            (2 + 8 + 1 = 1 1)
            (2 + 9 + 0 = 1 1)
            (2 + 9 + 1 = 2 1)
            (3 + 0 + 0 = 3 0)
            (3 + 0 + 1 = 4 0)
            (3 + 1 + 0 = 4 0)
            (3 + 1 + 1 = 5 0)
            (3 + 2 + 0 = 5 0)
            (3 + 2 + 1 = 6 0)
            (3 + 3 + 0 = 6 0)
            (3 + 3 + 1 = 7 0)
            (3 + 4 + 0 = 7 0)
            (3 + 4 + 1 = 8 0)
            (3 + 5 + 0 = 8 0)
            (3 + 5 + 1 = 9 0)
            (3 + 6 + 0 = 9 0)
            (3 + 6 + 1 = 0 1)
            (3 + 7 + 0 = 0 1)
            (3 + 7 + 1 = 1 1)
            (3 + 8 + 0 = 1 1)
            (3 + 8 + 1 = 2 1)
            (3 + 9 + 0 = 2 1)
            (3 + 9 + 1 = 3 1)
            (4 + 0 + 0 = 4 0)
            (4 + 0 + 1 = 5 0)
            (4 + 1 + 0 = 5 0)
            (4 + 1 + 1 = 6 0)
            (4 + 2 + 0 = 6 0)
            (4 + 2 + 1 = 7 0)
            (4 + 3 + 0 = 7 0)
            (4 + 3 + 1 = 8 0)
            (4 + 4 + 0 = 8 0)
            (4 + 4 + 1 = 9 0)
            (4 + 5 + 0 = 9 0)
            (4 + 5 + 1 = 0 1)
            (4 + 6 + 0 = 0 1)
            (4 + 6 + 1 = 1 1)
            (4 + 7 + 0 = 1 1)
            (4 + 7 + 1 = 2 1)
            (4 + 8 + 0 = 2 1)
            (4 + 8 + 1 = 3 1)
            (4 + 9 + 0 = 3 1)
            (4 + 9 + 1 = 4 1)
            (5 + 0 + 0 = 5 0)
            (5 + 0 + 1 = 6 0)
            (5 + 1 + 0 = 6 0)
            (5 + 1 + 1 = 7 0)
            (5 + 2 + 0 = 7 0)
            (5 + 2 + 1 = 8 0)
            (5 + 3 + 0 = 8 0)
            (5 + 3 + 1 = 9 0)
            (5 + 4 + 0 = 9 0)
            (5 + 4 + 1 = 0 1)
            (5 + 5 + 0 = 0 1)
            (5 + 5 + 1 = 1 1)
            (5 + 6 + 0 = 1 1)
            (5 + 6 + 1 = 2 1)
            (5 + 7 + 0 = 2 1)
            (5 + 7 + 1 = 3 1)
            (5 + 8 + 0 = 3 1)
            (5 + 8 + 1 = 4 1)
            (5 + 9 + 0 = 4 1)
            (5 + 9 + 1 = 5 1)
            (6 + 0 + 0 = 6 0)
            (6 + 0 + 1 = 7 0)
            (6 + 1 + 0 = 7 0)
            (6 + 1 + 1 = 8 0)
            (6 + 2 + 0 = 8 0)
            (6 + 2 + 1 = 9 0)
            (6 + 3 + 0 = 9 0)
            (6 + 3 + 1 = 0 1)
            (6 + 4 + 0 = 0 1)
            (6 + 4 + 1 = 1 1)
            (6 + 5 + 0 = 1 1)
            (6 + 5 + 1 = 2 1)
            (6 + 6 + 0 = 2 1)
            (6 + 6 + 1 = 3 1)
            (6 + 7 + 0 = 3 1)
            (6 + 7 + 1 = 4 1)
            (6 + 8 + 0 = 4 1)
            (6 + 8 + 1 = 5 1)
            (6 + 9 + 0 = 5 1)
            (6 + 9 + 1 = 6 1)
            (7 + 0 + 0 = 7 0)
            (7 + 0 + 1 = 8 0)
            (7 + 1 + 0 = 8 0)
            (7 + 1 + 1 = 9 0)
            (7 + 2 + 0 = 9 0)
            (7 + 2 + 1 = 0 1)
            (7 + 3 + 0 = 0 1)
            (7 + 3 + 1 = 1 1)
            (7 + 4 + 0 = 1 1)
            (7 + 4 + 1 = 2 1)
            (7 + 5 + 0 = 2 1)
            (7 + 5 + 1 = 3 1)
            (7 + 6 + 0 = 3 1)
            (7 + 6 + 1 = 4 1)
            (7 + 7 + 0 = 4 1)
            (7 + 7 + 1 = 5 1)
            (7 + 8 + 0 = 5 1)
            (7 + 8 + 1 = 6 1)
            (7 + 9 + 0 = 6 1)
            (7 + 9 + 1 = 7 1)
            (8 + 0 + 0 = 8 0)
            (8 + 0 + 1 = 9 0)
            (8 + 1 + 0 = 9 0)
            (8 + 1 + 1 = 0 1)
            (8 + 2 + 0 = 0 1)
            (8 + 2 + 1 = 1 1)
            (8 + 3 + 0 = 1 1)
            (8 + 3 + 1 = 2 1)
            (8 + 4 + 0 = 2 1)
            (8 + 4 + 1 = 3 1)
            (8 + 5 + 0 = 3 1)
            (8 + 5 + 1 = 4 1)
            (8 + 6 + 0 = 4 1)
            (8 + 6 + 1 = 5 1)
            (8 + 7 + 0 = 5 1)
            (8 + 7 + 1 = 6 1)
            (8 + 8 + 0 = 6 1)
            (8 + 8 + 1 = 7 1)
            (8 + 9 + 0 = 7 1)
            (8 + 9 + 1 = 8 1)
            (9 + 0 + 0 = 9 0)
            (9 + 0 + 1 = 0 1)
            (9 + 1 + 0 = 0 1)
            (9 + 1 + 1 = 1 1)
            (9 + 2 + 0 = 1 1)
            (9 + 2 + 1 = 2 1)
            (9 + 3 + 0 = 2 1)
            (9 + 3 + 1 = 3 1)
            (9 + 4 + 0 = 3 1)
            (9 + 4 + 1 = 4 1)
            (9 + 5 + 0 = 4 1)
            (9 + 5 + 1 = 5 1)
            (9 + 6 + 0 = 5 1)
            (9 + 6 + 1 = 6 1)
            (9 + 7 + 0 = 6 1)
            (9 + 7 + 1 = 7 1)
            (9 + 8 + 0 = 7 1)
            (9 + 8 + 1 = 8 1)
            (9 + 9 + 0 = 8 1)
            (9 + 9 + 1 = 9 1)

            /*
                TODO: we need to normalize 0 defintion 00000 ...
                ((dec) + (dec) + 0 = (dec 0 (dec)) (list))

            */
            ((dec) + (dec) + 0 = (dec) (list))
            ((dec) + (dec) + 1 = (dec 1 (dec)) (list))

            ((dec) + (dec 'y 'yt) + 0 = (dec 'y 'yt) (list))
            ((dec 'x 'xt) + (dec) + 0 = (dec 'x 'xt) (list))


            ((dec) + (dec 'y 'yt) + 1 = (dec 'r 'rt)
                (list (0 + 'y + 1 = 'r 'c)
                    (list ((dec) + 'yt + 'c = 'rt ')
                        (list)
                    )
                )
            )

            ((dec 'x 'xt) + (dec) + 1 = (dec 'r 'rt)
                (list ('x + 0 + 1 = 'r 'c)
                    (list ('xt + (dec) + 'c = 'rt ')
                        (list)
                    )
                )
            )

            ((dec 'x 'xt) + (dec 'y 'yt) + 'carry = (dec 'r 'rt)
                (list ('x + 'y + 'carry = 'r 'c)
                    (list ('xt + 'yt + 'c = 'rt ')
                        (list)
                    )
                )
            )

            # declare set
            (equal 'x 'x)

            (set)
            (set 'a (set) ')
            (set 'a (set 'b 'tail ') (set 'a 'tail ') ^(equal 'a 'b))

            # declare send more money puzzle
            # send + more = money
            # dnes + erom = yenom

            (
                send-more-money
                (
                    (dec 'd (dec 'n (dec 'e (dec 's (dec 0 (dec))))))
                    +
                    (dec 'e (dec 'r (dec 'o (dec 'm (dec 0 (dec))))))
                    +
                    0
                    =
                    (dec 'y (dec 'e (dec 'n (dec 'o (dec 'm (dec))))))
                    '
                )

                (set 's
                (set 'e
                (set 'n
                (set 'd
                (set 'm
                (set 'o
                (set 'r
                (set 'y
                (set) ') ') ') ') ') ') ') ')
            )
            `,
			[{
				query: "?(send-more-money ' ')",
				results: [
					"TODO"
				]
            }],
            { timeout: 24 * 60 * 60 * 1000 }
		)
	);
});
