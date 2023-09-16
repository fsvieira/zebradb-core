"use strict";

const test = require("../test-utils/test");

describe("Plan Math graphs.", () => {
	it("Plan Math Ops", test(
		`
			$MATH_OPS = {('x:$NAT + 'y:$NAT) |}

			$MATH_ADD = { ('z:$NAT = ('x + 'y):$MATH_OPS) | 
				'z = 'x + 'y and 'x = 'z - 'y and 'y = 'z - 'x  
			}

			$NAT = {0} union {'x | ('x = ('a:$NAT + 1)):$MATH_ADD }

			/*
			$NAT_PEANO = {(nat 0 0)} 
				UNION {(nat (nat ' 'x:$NAT):NAT_PEANO 'n:$NAT) |
					('n = ('x + 1))
			}

			$MATH_ADD = { (('a + 'b) = 'c) | 'c = 'a + 'b } 

            $MATH_RULES = {
                ('a + 'b) <=> ('b + 'a)
                ('x = 'y) <=> ('y = 'x)
                (('a + 'b) + 'c) <=> ('a + ('b + 'c)) 
                ('c = ('a + 'b)) <=> ('b = ('c - 'a)) <=> ('a = ('c - 'b)) 
            }*/
        `, 
		[
			{
				query: "('enc 'dec 'codes):$CYPHER",
				results: [
					"@(0 & 0 = 0)", 
					"@(0 & 1 = 0)", 
					"@(1 & 0 = 0)", 
					"@(1 & 1 = 1)" 
				]
			},
		], 
		{path: 'dbs/plan-math-ops/1', timeout: 1000 * 60}
	));
});


