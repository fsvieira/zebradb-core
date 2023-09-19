"use strict";

const test = require("../test-utils/test");

describe("Plan Math graphs.", () => {
	it("Plan Math Ops: Send More Money", test(
		`			
			$DIGITS = {0 1 2 3 4 5 6 7 8 9}
			
			$SEND_MORE_MONEY = {
				(
					'S:$DIGITS 'E:$DIGITS 'N:$DIGITS 'D:$DIGITS +
					'M:$DIGITS 'O:$DIGITS 'R:$DIGITS 'E:$DIGITS =
					'M:$DIGITS 'O:$DIGITS 'N:$DIGITS 'E:$DIGITS 'Y:$DIGITS
				) |
				
				# Define constraints to ensure each letter represents a unique digit
				'S != 'E, 'S != 'N, 'S != 'D, 'S != 'M, 'S != 'O, 'S != 'R, 'S != 'Y,
				'E != 'N, 'E != 'D, 'E != 'M, 'E != 'O, 'E != 'R, 'E != 'Y,
				'N != 'D, 'N != 'M, 'N != 'O, 'N != 'R, 'N != 'Y,
				'D != 'M, 'D != 'O, 'D != 'R, 'D != 'Y,
				'M != 'O, 'M != 'R, 'M != 'Y,
				'O != 'R, 'O != 'Y,
				'R != 'Y,

				# Define the addition equation
				'M * 10000 + 'O * 1000 + 'N * 100 + 'E * 10 + 'Y =
					['S * 1000 + 'E * 100 + 'N * 10 + 'D] + ['M * 1000 + 'O * 100 + 'R * 10 + 'E]
			}
        `, 
		[
			{
				query: "(10 = ('a + 3)):$MATH_ADD",
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

	xit("Plan Math Ops: Send More Money", test(
		`			
			$MATH_OPS = {('x + 'y) |}

			$MATH_ADD = { ('z = ('x + 'y):$MATH_OPS) | 
				'z = 'x + 'y and 'x = 'z - 'y and 'y = 'z - 'x  
			}

			$DIGITS = {0 1 2 3 4 5 6 7 8 9}
			
			$SEND_MORE_MONEY = {
				(
					'S:$DIGITS 'E:$DIGITS 'N:$DIGITS 'D:$DIGITS +
					'M:$DIGITS 'O:$DIGITS 'R:$DIGITS 'E:$DIGITS =
					'M:$DIGITS 'O:$DIGITS 'N:$DIGITS 'E:$DIGITS 'Y:$DIGITS
				) |
				# Define constraints to ensure each letter represents a unique digit
				
				'S != 'E, 'S != 'N, 'S != 'D, 'S != 'M, 'S != 'O, 'S != 'R, 'S != 'Y,
				'E != 'N, 'E != 'D, 'E != 'M, 'E != 'O, 'E != 'R, 'E != 'Y,
				'N != 'D, 'N != 'M, 'N != 'O, 'N != 'R, 'N != 'Y,
				'D != 'M, 'D != 'O, 'D != 'R, 'D != 'Y,
				'M != 'O, 'M != 'R, 'M != 'Y,
				'O != 'R, 'O != 'Y,
				'R != 'Y,

				
				# Define the addition equation

				'send_s = 'O * 1000;
				'send_e = 'N * 100;
				'send_n = 'E * 10;
				'send_d = 'Y * 1;

				'more_m = 'M * 1000;
				'more_o = 'O * 100;
				'more_r = 'R * 10;
				'more_e = 'E * 1;

				'money_m = 'M * 10000; 
				'money_o = 'O * 1000;
				'money_n = 'N * 100;
				'money_e = 'E * 10;
				'money_y = 'Y * 1;

				('s1 = ('send_s + 'send_e))
				('s2 = ('s1 + 'send_n))
				('send = ('s2 + 'send_d))

				('m1 = ('more_m + 'more_o))
				('m2 = ('m1 + 'more_r))
				('more = ('m2 + 'more_e))

				('mo1 = ('money_m + 'money_o))
				('mo2 = ('mo1 + 'money_n))
				('mo3 = ('mo3 + 'money_e))
				('money = ('mo3 + 'money_y))
				

				('money = ('send + 'more))

			}
        `, 
		[
			{
				query: "(10 = ('a + 3)):$MATH_ADD",
				results: [
					"@(0 & 0 = 0)", 
					"@(0 & 1 = 0)", 
					"@(1 & 0 = 0)", 
					"@(1 & 1 = 1)" 
				]
			},
		], 
		{path: 'dbs/plan-math-ops/2', timeout: 1000 * 60}
	));

	xit("Plan Math Ops", test(
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
				query: "(10 = ('a + 3)):$MATH_ADD",
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

