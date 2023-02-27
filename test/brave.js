"use strict";

const test = require("../test-utils/test");

describe("Brave puzzle Tests.", () => {
    it("should solve brave puzzle",
		test(
			`
            (letter '{B R A V E})

            ('x != ~'x)

            (line
                'b 'r 'a 'v 'e
                (conditions
                    ('b != 'r)
                    ('b != 'a)
                    ('b != 'v)
                    ('b != 'e)
                    
                    ('r != 'a)
                    ('r != 'v)
                    ('r != 'e)

                    ('a != 'v)
                    ('a != 'e)

                    ('v != 'e)
                )
            )

            (conditions '1 '2 '3 '4 '5 '6 '7 '8 '9 '10)
            (lines '1 '2 '3 '4 '5 '6 '7 '8 '9 '10 '11 '12)

            (letters 
                'x1y1 'x2y1 'x3y1 'x4y1 'x5y1
                'x1y2 'x2y2 'x3y2 'x4y2 'x5y2
                'x1y3 'x2y3 'x3y3 'x4y3 'x5y3
                'x1y4 'x2y4 'x3y4 'x4y4 'x5y4
                'x1y5 'x2y5 'x3y5 'x4y5 'x5y5 
            )

            (brave
                'x1y1 'x2y1 'x3y1 'x4y1 'x5y1
                'x1y2 'x2y2 'x3y2 'x4y2 'x5y2
                'x1y3 'x2y3 'x3y3 'x4y3 'x5y3
                'x1y4 'x2y4 'x3y4 'x4y4 'x5y4
                'x1y5 'x2y5 'x3y5 'x4y5 'x5y5
                (lines
                    (line 'x1y1 'x2y1 'x3y1 'x4y1 'x5y1 ')
                    (line 'x1y2 'x2y2 'x3y2 'x4y2 'x5y2 ')
                    (line 'x1y3 'x2y3 'x3y3 'x4y3 'x5y3 ')
                    (line 'x1y4 'x2y4 'x3y4 'x4y4 'x5y4 ')
                    (line 'x1y5 'x2y5 'x3y5 'x4y5 'x5y5 ')

                    (line 'x1y1 'x1y2 'x1y3 'x1y4 'x1y5 ')
                    (line 'x2y1 'x2y2 'x2y3 'x2y4 'x2y5 ')
                    (line 'x3y1 'x3y2 'x3y3 'x3y4 'x3y5 ')
                    (line 'x4y1 'x4y2 'x4y3 'x4y4 'x4y5 ')
                    (line 'x5y1 'x5y2 'x5y3 'x5y4 'x5y5 ')

                    (line 'x1y1 'x2y2 'x3y3 'x4y4 'x5y5 ')
                    (line 'x1y5 'x2y4 'x3y3 'x4y2 'x5y1 ')
                )
                (letters
                    (letter 'x1y1) (letter 'x2y1) (letter 'x3y1) (letter 'x4y1) (letter 'x5y1)
                    (letter 'x1y2) (letter 'x2y2) (letter 'x3y2) (letter 'x4y2) (letter 'x5y2)
                    (letter 'x1y3) (letter 'x2y3) (letter 'x3y3) (letter 'x4y3) (letter 'x5y3)
                    (letter 'x1y4) (letter 'x2y4) (letter 'x3y4) (letter 'x4y4) (letter 'x5y4)
                    (letter 'x1y5) (letter 'x2y5) (letter 'x3y5) (letter 'x4y5) (letter 'x5y5)   
                )
            )
            `, [{
                /*
                        B R A V E
                        V E B R A
                        R A V E B
                        E B R A V
                        A V E B R
                */
                    query: `
                        (brave
                            B R A V E
                            ' E B R '
                            ' ' V ' '
                            ' B R ' '
                            ' ' E B '
                            ' '
                        )
                    `,                    
                    results: [
                       `@(brave B R A V E V E B R A R A V E B E B R A V A V E B R @(lines @(line B R A V E @(conditions @(B != R) @(B != A) @(B != V) @(B != E) @(R != A) @(R != V) @(R != E) @(A != V) @(A != E) @(V != E))) @(line V E B R A @(conditions @(V != E) @(V != B) @(V != R) @(V != A) @(E != B) @(E != R) @(E != A) @(B != R) @(B != A) @(R != A))) @(line R A V E B @(conditions @(R != A) @(R != V) @(R != E) @(R != B) @(A != V) @(A != E) @(A != B) @(V != E) @(V != B) @(E != B))) @(line E B R A V @(conditions @(E != B) @(E != R) @(E != A) @(E != V) @(B != R) @(B != A) @(B != V) @(R != A) @(R != V) @(A != V))) @(line A V E B R @(conditions @(A != V) @(A != E) @(A != B) @(A != R) @(V != E) @(V != B) @(V != R) @(E != B) @(E != R) @(B != R))) @(line B V R E A @(conditions @(B != V) @(B != R) @(B != E) @(B != A) @(V != R) @(V != E) @(V != A) @(R != E) @(R != A) @(E != A))) @(line R E A B V @(conditions @(R != E) @(R != A) @(R != B) @(R != V) @(E != A) @(E != B) @(E != V) @(A != B) @(A != V) @(B != V))) @(line A B V R E @(conditions @(A != B) @(A != V) @(A != R) @(A != E) @(B != V) @(B != R) @(B != E) @(V != R) @(V != E) @(R != E))) @(line V R E A B @(conditions @(V != R) @(V != E) @(V != A) @(V != B) @(R != E) @(R != A) @(R != B) @(E != A) @(E != B) @(A != B))) @(line E A B V R @(conditions @(E != A) @(E != B) @(E != V) @(E != R) @(A != B) @(A != V) @(A != R) @(B != V) @(B != R) @(V != R))) @(line B E V A R @(conditions @(B != E) @(B != V) @(B != A) @(B != R) @(E != V) @(E != A) @(E != R) @(V != A) @(V != R) @(A != R))) @(line A B V R E @(conditions @(A != B) @(A != V) @(A != R) @(A != E) @(B != V) @(B != R) @(B != E) @(V != R) @(V != E) @(R != E)))) @(letters @(letter B) @(letter R) @(letter A) @(letter V) @(letter E) @(letter V) @(letter E) @(letter B) @(letter R) @(letter A) @(letter R) @(letter A) @(letter V) @(letter E) @(letter B) @(letter E) @(letter B) @(letter R) @(letter A) @(letter V) @(letter A) @(letter V) @(letter E) @(letter B) @(letter R)))`
				    ]
			}], { 
                timeout: 60000 * 35,
                path: 'dbs/brave/1'
            }
		)
	);

    // TODO: Tuple negations needs more tests, this is failing!!
    xit("should solve brave puzzle (2)",
		test(
			`
            (letter '[B R A V E])

            ('x != ~'x)

            (line
                'b 'r 'a 'v 'e
                (conditions
                    ((letter 'b) != (letter 'r))
                    ((letter 'b) != (letter 'a))
                    ((letter 'b) != (letter 'v))
                    ((letter 'b) != (letter 'e))
                    
                    ((letter 'r) != (letter 'a))
                    ((letter 'r) != (letter 'v))
                    ((letter 'r) != (letter 'e))

                    ((letter 'a) != (letter 'v))
                    ((letter 'a) != (letter 'e))

                    ((letter 'v) != (letter 'e))
                )
            )

            (conditions '1 '2 '3 '4 '5 '6 '7 '8 '9 '10)
            (lines '1 '2 '3 '4 '5 '6 '7 '8 '9 '10 '11 '12)

            (brave
                'x1y1 'x2y1 'x3y1 'x4y1 'x5y1
                'x1y2 'x2y2 'x3y2 'x4y2 'x5y2
                'x1y3 'x2y3 'x3y3 'x4y3 'x5y3
                'x1y4 'x2y4 'x3y4 'x4y4 'x5y4
                'x1y5 'x2y5 'x3y5 'x4y5 'x5y5
                (lines
                    (line 'x1y1 'x2y1 'x3y1 'x4y1 'x5y1 ')
                    (line 'x1y2 'x2y2 'x3y2 'x4y2 'x5y2 ')
                    (line 'x1y3 'x2y3 'x3y3 'x4y3 'x5y3 ')
                    (line 'x1y4 'x2y4 'x3y4 'x4y4 'x5y4 ')
                    (line 'x1y5 'x2y5 'x3y5 'x4y5 'x5y5 ')

                    (line 'x1y1 'x1y2 'x1y3 'x1y4 'x1y5 ')
                    (line 'x2y1 'x2y2 'x2y3 'x2y4 'x2y5 ')
                    (line 'x3y1 'x3y2 'x3y3 'x3y4 'x3y5 ')
                    (line 'x4y1 'x4y2 'x4y3 'x4y4 'x4y5 ')
                    (line 'x5y1 'x5y2 'x5y3 'x5y4 'x5y5 ')

                    (line 'x1y1 'x2y2 'x3y3 'x4y4 'x5y5 ')
                    (line 'x1y5 'x2y4 'x3y3 'x4y2 'x5y1 ')
                )
            )
            `, [{
                /*
                        B R A V E
                        V E B R A
                        R A V E B
                        E B R A V
                        A V E B R
                */
                    query: `
                        (brave
                            B R A V E
                            V E B R A
                            ' A V E B
                            E B R A V
                            A V E B R
                            '
                        )
                    `,                    
                    results: [
                       `@(brave B R A V E V E B R A R A V E B E B R A V A V E B R @(lines @(line B R A V E @(conditions @(@(letter B) != @(letter R)) @(@(letter B) != @(letter A)) @(@(letter B) != @(letter V)) @(@(letter B) != @(letter E)) @(@(letter R) != @(letter A)) @(@(letter R) != @(letter V)) @(@(letter R) != @(letter E)) @(@(letter A) != @(letter V)) @(@(letter A) != @(letter E)) @(@(letter V) != @(letter E)))) @(line V E B R A @(conditions @(@(letter V) != @(letter E)) @(@(letter V) != @(letter B)) @(@(letter V) != @(letter R)) @(@(letter V) != @(letter A)) @(@(letter E) != @(letter B)) @(@(letter E) != @(letter R)) @(@(letter E) != @(letter A)) @(@(letter B) != @(letter R)) @(@(letter B) != @(letter A)) @(@(letter R) != @(letter A)))) @(line R A V E B @(conditions @(@(letter R) != @(letter A)) @(@(letter R) != @(letter V)) @(@(letter R) != @(letter E)) @(@(letter R) != @(letter B)) @(@(letter A) != @(letter V)) @(@(letter A) != @(letter E)) @(@(letter A) != @(letter B)) @(@(letter V) != @(letter E)) @(@(letter V) != @(letter B)) @(@(letter E) != @(letter B)))) @(line E B R A V @(conditions @(@(letter E) != @(letter B)) @(@(letter E) != @(letter R)) @(@(letter E) != @(letter A)) @(@(letter E) != @(letter V)) @(@(letter B) != @(letter R)) @(@(letter B) != @(letter A)) @(@(letter B) != @(letter V)) @(@(letter R) != @(letter A)) @(@(letter R) != @(letter V)) @(@(letter A) != @(letter V)))) @(line A V E B R @(conditions @(@(letter A) != @(letter V)) @(@(letter A) != @(letter E)) @(@(letter A) != @(letter B)) @(@(letter A) != @(letter R)) @(@(letter V) != @(letter E)) @(@(letter V) != @(letter B)) @(@(letter V) != @(letter R)) @(@(letter E) != @(letter B)) @(@(letter E) != @(letter R)) @(@(letter B) != @(letter R)))) @(line B V R E A @(conditions @(@(letter B) != @(letter V)) @(@(letter B) != @(letter R)) @(@(letter B) != @(letter E)) @(@(letter B) != @(letter A)) @(@(letter V) != @(letter R)) @(@(letter V) != @(letter E)) @(@(letter V) != @(letter A)) @(@(letter R) != @(letter E)) @(@(letter R) != @(letter A)) @(@(letter E) != @(letter A)))) @(line R E A B V @(conditions @(@(letter R) != @(letter E)) @(@(letter R) != @(letter A)) @(@(letter R) != @(letter B)) @(@(letter R) != @(letter V)) @(@(letter E) != @(letter A)) @(@(letter E) != @(letter B)) @(@(letter E) != @(letter V)) @(@(letter A) != @(letter B)) @(@(letter A) != @(letter V)) @(@(letter B) != @(letter V)))) @(line A B V R E @(conditions @(@(letter A) != @(letter B)) @(@(letter A) != @(letter V)) @(@(letter A) != @(letter R)) @(@(letter A) != @(letter E)) @(@(letter B) != @(letter V)) @(@(letter B) != @(letter R)) @(@(letter B) != @(letter E)) @(@(letter V) != @(letter R)) @(@(letter V) != @(letter E)) @(@(letter R) != @(letter E)))) @(line V R E A B @(conditions @(@(letter V) != @(letter R)) @(@(letter V) != @(letter E)) @(@(letter V) != @(letter A)) @(@(letter V) != @(letter B)) @(@(letter R) != @(letter E)) @(@(letter R) != @(letter A)) @(@(letter R) != @(letter B)) @(@(letter E) != @(letter A)) @(@(letter E) != @(letter B)) @(@(letter A) != @(letter B)))) @(line E A B V R @(conditions @(@(letter E) != @(letter A)) @(@(letter E) != @(letter B)) @(@(letter E) != @(letter V)) @(@(letter E) != @(letter R)) @(@(letter A) != @(letter B)) @(@(letter A) != @(letter V)) @(@(letter A) != @(letter R)) @(@(letter B) != @(letter V)) @(@(letter B) != @(letter R)) @(@(letter V) != @(letter R)))) @(line B E V A R @(conditions @(@(letter B) != @(letter E)) @(@(letter B) != @(letter V)) @(@(letter B) != @(letter A)) @(@(letter B) != @(letter R)) @(@(letter E) != @(letter V)) @(@(letter E) != @(letter A)) @(@(letter E) != @(letter R)) @(@(letter V) != @(letter A)) @(@(letter V) != @(letter R)) @(@(letter A) != @(letter R)))) @(line A B V R E @(conditions @(@(letter A) != @(letter B)) @(@(letter A) != @(letter V)) @(@(letter A) != @(letter R)) @(@(letter A) != @(letter E)) @(@(letter B) != @(letter V)) @(@(letter B) != @(letter R)) @(@(letter B) != @(letter E)) @(@(letter V) != @(letter R)) @(@(letter V) != @(letter E)) @(@(letter R) != @(letter E))))))`
				    ]
			}], { 
                timeout: 60000 * 35,
                path: 'dbs/brave/2'
            }
		)
	);
});
