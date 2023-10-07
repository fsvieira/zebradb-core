"use strict";

const test = require("../test-utils/test");

describe("Plan Math graphs.", () => {
	xit("Simple Add", test(
		`
		$DIGITS = {0 1 2 3 4 5 6 7 8 9}
			
		$ADD = {('r = 'a:$DIGITS + 'b:$DIGITS) | 'r = 'a + 'b }
	`
		,	 
		[
			{
				query: `('r = 1 + 1):$ADD`,
				results: [
					"@(2 = 1 + 1)" 
				]
			},
			{
				query: `('r = 'a + 1):$ADD`,
				results: [
					"@(1 = 0 + 1)",
					"@(10 = 9 + 1)",
					"@(2 = 1 + 1)",
					"@(3 = 2 + 1)",
					"@(4 = 3 + 1)",
					"@(5 = 4 + 1)",
					"@(6 = 5 + 1)",
					"@(7 = 6 + 1)",
					"@(8 = 7 + 1)",
					"@(9 = 8 + 1)"
				]
			},
			{
				query: `(8 = 'a + 2):$ADD`,
				results: [
					"@(8 = 6 + 2)" 
				]
			}
		], 
		{path: 'dbs/plan-math-ops/1', timeout: 1000 * 60 * 60}
	));

	xit("Solve Add", test(
		`
		$DIGITS = {0 1 2 3 4 5 6 7 8 9}
			
		$ADD = {('r = 'a:$DIGITS + 'b:$DIGITS) | 
			['r = ['a + 'b]], 
			['a = ['r - 'b]],
			['b = ['r - 'a]]
		}
	`
		,	 
		[
			{
				query: `(8 = 'a + 2):$ADD`,
				results: [
					"@(8 = 6 + 2)" 
				]
			}
		], 
		{path: 'dbs/plan-math-ops/2', timeout: 1000 * 60 * 60}
	));

	xit("Solve Add (precedence in operators Expressions)", test(
		`
		$DIGITS = {0 1 2 3 4 5 6 7 8 9}
			
		$ADD = {('r = 'a:$DIGITS + 'b:$DIGITS) | 
			'r = 'a + 'b, 
			'a = 'r - 'b,
			'b = 'r - 'a
		}
	`
		,	 
		[
			{
				query: `(8 = 'a + 2):$ADD`,
				results: [
					"@(8 = 6 + 2)" 
				]
			}
		], 
		{path: 'dbs/plan-math-ops/3', timeout: 1000 * 60 * 60}
	));

	xit("Plan Math Ops: Not Equal", test(
		`			
			$DIGITS = {0 1 2}
			$NOT_EQUAL_TEST = {
				('A:$DIGITS 'B:$DIGITS 'C:$DIGITS) |
				
				# Define constraints to ensure each letter represents a unique digit
				'A != 'B, 'A != 'C,
				'B != 'C 		
			}
        `, 
		[
			{
				query: `('A 'B 'C):$NOT_EQUAL_TEST`,
				results: [ 
					'@(0 1 2)', 
					'@(0 2 1)', 
					'@(1 0 2)', 
					'@(1 2 0)', 
					'@(2 0 1)', 
					'@(2 1 0)' 
				]
			},
		], 
		{path: 'dbs/plan-math-ops/4', timeout: 1000 * 60 * 60}
	));

	xit("Plan Math Ops: Send More Money", test(
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
					'S * 1000 + 'E * 100 + 'N * 10 + 'D + 
					'M * 1000 + 'O * 100 + 'R * 10 + 'E
				
			}
        `, 
		[
			{
				query: `(
				    'S 'E 'N 'D +
					'M 'O 'R 'E =
				  1 'O 'N 'E 'Y
				):$SEND_MORE_MONEY`,
				results: [
					"@(9 5 6 7 + 1 0 8 5 = 1 0 6 5 2)" 
				]
			},
			/*{
				query: `(
				    'S 'E 'N 'D +
					'M 'O 'R 'E =
				  1 'O 'N 'E 'Y
				):$SEND_MORE_MONEY`,
				results: [
					"@(9 5 6 7 + 1 0 8 5 = 1 0 6 5 2)" 
				]
			},*/
		], 
		{path: 'dbs/plan-math-ops/5', timeout: 1000 * 60 * 60}
	));

	it("Plan Math Ops: Make Adder", test(
		`			
			$BOOL = {0 1}

			$BIN_ADD = {
				(
					'a:$BOOL
					'b:$BOOL
					'cin:$BOOL
					'cout:$BOOL
					'sum:$BOOL
				) | 
					's = 'a + 'b + 'cin,
					[
						's >= 2,
						'sum = 's - 2,
						'cout = 1;

						's < 2,
						'sum = 's,
						'cout = 0
					]
			}

        `, 
		[
			{
				query: `(
					0
					0
					0
					1
					0
				):$BIN_ADD`,
				results: [
					"@(0 & 0 = 0)", 
					"@(0 & 1 = 0)", 
					"@(1 & 0 = 0)", 
					"@(1 & 1 = 1)" 
				]
			},
		], 
		{path: 'dbs/plan-math-ops/7', timeout: 1000 * 60 * 5}
	));

	xit("Plan Math Ops: Numbers", test(
		`			
			$DIGITS = {0 1 2 3 4 5 6 7 8 9}

			$NUMBER = {
				('min 'max 'n:$NUMBER_SEQ) |
					{ ('i n:$DIGITS) | 'i >= 'min AND i <= 'max } 
			}

			$NUMBER_LESS = {
				(('maxA 'minA 'a:$NUMBER) < ('maxB 'minB 'b:$NUMBER)) |
				('maxA 'an) in 'a,
				('maxB 'bn) in 'b,

				'an < 'bn OR [
					'an = 'bn, 
					'mA = 'maxA - 1,
					'mB = 'maxB - 1,
					(('mA, 'minA 'a) < ('mB 'minB 'b))
				]
			}

        `, 
		[
			{
				query: `(
					1
					9
					'cin
					'sum
					'cout
				):$DECIMAL_ADD`,
				results: [
					"@(0 & 0 = 0)", 
					"@(0 & 1 = 0)", 
					"@(1 & 0 = 0)", 
					"@(1 & 1 = 1)" 
				]
			},
		], 
		{path: 'dbs/plan-math-ops/8', timeout: 1000 * 60 * 5}
	));

	xit("Plan Math Ops: Make Adder", test(
		`			
			$DIGITS = {0 1 2 3 4 5 6 7 8 9}
			$BOOL = {0 1}

			$DECIMAL_ADD = {
				(
					'a:$DIGITS
					'b:$DIGITS
					'cin:$BOOL
					'sum:$DIGITS
					'cout:$DIGITS
				) | 
					's = 'a + 'b + 'cin,
					[
						's >= 10,
						'sum = 's - 10,
						'cout = 1;

						's < 10,
						'sum = 's,
						'cout = 0
					]
			}

        `, 
		[
			{
				query: `(
					1
					9
					'cin
					'sum
					'cout
				):$DECIMAL_ADD`,
				results: [
					"@(0 & 0 = 0)", 
					"@(0 & 1 = 0)", 
					"@(1 & 0 = 0)", 
					"@(1 & 1 = 1)" 
				]
			},
		], 
		{path: 'dbs/plan-math-ops/6', timeout: 1000 * 60 * 5}
	));

	xit("Plan Math Ops: Send More Money (distinct)", test(
		`			
			$DIGITS = {0 1 2 3 4 5 6 7 8 9}
			
			$SEND_MORE_MONEY = {
				(
					'S 'E 'N 'D +
					'M 'O 'R 'E =
					'M 'O 'N 'E 'Y
				) |

				# make variables distinct 
				'vars = {
					'S:$DIGITS 'E:DIGITS 'N:DIGITS 'D:DIGITS 
					'M:DIGITS 'O:DIGITS 'R:DIGITS 'Y:DIGITS
				}

				# Define the addition equation
				'M * 10000 + 'O * 1000 + 'N * 100 + 'E * 10 + 'Y =
					['S * 1000 + 'E * 100 + 'N * 10 + 'D] + ['M * 1000 + 'O * 100 + 'R * 10 + 'E]
			}
        `, 
		[
			{
				query: `(
				    'S 'E 'N 'D +
					'M 'O 'R 'E =
				 'M 'O 'N 'E 'Y
				):$SEND_MORE_MONEY`,
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


