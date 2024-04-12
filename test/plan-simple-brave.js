"use strict";

const test = require("../test-utils/test");

describe("Plan Simple Puzzles", () => {

	/*it("Simple Unique", test(
		`
			$N = {1 2}
			$TEST = {{('x:$N 'y:$N) | 'd = 'x + 'y } ['x, 'y] is unique ...}
		`, [{
			query: `{{('x 'y) ...}:$TEST ...}`,
			results: [`{{(1 1) (1 2) (2 1) (2 2) }:$TEST ...}`]
		}], {
			path: 'dbs/plan-simple-brave/1', 
			timeout: 1000 * 60 * 60,
			log: true
		})
	);*/

	xit("Simple Unique", test(
		`
			$N = {1 2}
			$TEST = {{('x:$N 'y:$N) | 'x != 'y } ['x, 'y] is unique ...}
		`, [{
			query: `{{('x 'y) ...}:$TEST ...}`,
			results: []
		}], {
			path: 'dbs/plan-simple-brave/2', 
			timeout: 1000 * 60 * 60,
			log: true
		})
	);

	it("Simple Brave", test(
		`
			$LETTER = {B R A V E}
			$N = {1 2 3 4 5}

			/*
			$BRAVE = {
				{('l:$LETTER 'x:$N 'y:$N 'd1 'd2) |
					[ ['x = 'y and 'd1 = 101 ] or ['x != 'y and ['d1 = 'y * 5 + 'x]] ] 
					and 
					[ [['y = 6 - 'x] and 'd2 = 102 ] or [['y != 6 - 'x] and ['d2 = 'y * 5 + 'x]]]
				}
				['x, 'y] is unique,
				['l, 'x] is unique, 
				['l, 'y] is unique,
				['l, 'x, 'y] is unique,
				['l, 'd1] is unique,
				['l, 'd2] is unique
			...}
			*/

			$BRAVE = {
				{('l:$LETTER 'x:$N 'y:$N 'd1 'd2) |
					[ ['x = 'y and 'd1 = 101 ] or ['x != 'y and ['d1 = 'y * 5 + 'x]] ] 
					and 
					[ [['y = 6 - 'x] and 'd2 = 102 ] or [['y != 6 - 'x] and ['d2 = 'y * 5 + 'x]]]
				} 
				as 's,
				['x, 'y] is unique,
				['l, 'x] is unique, 
				['l, 'y] is unique,
				['l, 'x, 'y] is unique,
				['l, 'd1] is unique,
				['l, 'd2] is unique
			|
				# only solutions with full size are valid
				|'s| = |$N| * |$N| 
			}
		`,
		[
			{
				query: `{
					{
						(B 1 1 ' ') (R 2 1 ' ') (A 3 1 ' ') (V 4 1 ' ') (E 5 1 ' ')
                                    (E 2 2 ' ') (B 3 2 ' ') (R 4 2 ' ') 
                                                (V 3 3 ' ') 
                                    (B 2 4 ' ') (R 3 4 ' ')
                                                (E 3 5 ' ') (B 4 5 ' ') ('l 'x 'y ' ')
						... 
					}:$BRAVE ... 
				}`
				/*
				query: `{
					{
						(B 1 1 ' ') ('l 'x 'y ' ')
						... 
					}:$BRAVE ... 
				}`*/
				/*
                        B R A V E
                        V E B R A
                        R A V E B
                        E B R A V
                        A V E B R
                */
				/*`{
					{
						(B 1 1 ' ') (R 2 1 ' ') (A 3 1 ' ') (V 4 1 ' ') (E 5 1 ' ')
                        (V 1 2 ' ') (E 2 2 ' ') (B 3 2 ' ') (R 4 2 ' ') (A 5 2 ' ')
                        (R 1 3 ' ') (A 2 3 ' ') (V 3 3 ' ') (E 4 3 ' ') (B 5 3 ' ') 
                        (E 1 4 ' ') (B 2 4 ' ') (R 3 4 ' ') (A 4 4 ' ') (V 5 4 ' ')
                        (A 1 5 ' ') (V 2 5 ' ') (E 3 5 ' ') (B 4 5 ' ') (R 5 5 ' ') 
						...
					}:$BRAVE ... 
				}`*/
				/*`{
					{
						(B 1 1 ' ') (R 2 1 ' ') 
						...
					}:$BRAVE ... 
				}`*/,
				results: [
					"@(2 = 1 + 1)" 
				]
			}
		], 
		{
			path: 'dbs/plan-simple-brave/3', 
			timeout: 1000 * 60 * 60,
			log: true
		}
	));

	// ---- 
	xit("Line Simple (Unique)", test(
		`
			$LETTER = {A B}
			$N = {1 2}

			$LINE = {
				{('l:$LETTER 'n:$N) | } 'l is unique, 'n is unique |
			}
		`,	 
		[
			{
				query: `{'e:'s | 's in $LINE}`,
				results: [
					"@(2 = 1 + 1)" 
				]
			}
		], 
		{
			path: 'dbs/plan-simple-brave/1', 
			timeout: 1000 * 60 * 60,
			log: true
		}
	));

	xit("Line Combinatorial (Unique)", test(
		`
			$LETTER = {A B}
			$N = {1 2}

			$LINE = {
				{('l:$LETTER 'n:$N) | } 'l is unique, 'n is unique |
			}
		`,	 
		[
			{
				query: `{'e:'s | 's in $LINE}`,
				results: [
					"@(2 = 1 + 1)" 
				]
			}
		], 
		{path: 'dbs/plan-simple-brave/1', timeout: 1000 * 60 * 60}
	));

	xit("Line Combinatorial (1)", test(
		`
			$LETTER = {A B}
			$N = {1 2}

			$LINE = {('l:$LETTER 'n:$N) unique 'l, unique 'n |}
		`,	 
		[
			{
				query: `('l 'n):$LINE`,
				results: [
					"@(2 = 1 + 1)" 
				]
			}
		], 
		{path: 'dbs/plan-simple-brave/1', timeout: 1000 * 60 * 60}
	));

	xit("Line Combinatorial", test(
		`
			$LETTER = {B R A V E}
			$N = {1 2 3 4 5}

			$LINE = {('s) | 's = {('l:$LETTER 'n:$N) unique 'l, unique 'n |} }
		`,	 
		[
			{
				query: `('s):$LINE`,
				results: [
					"@(2 = 1 + 1)" 
				]
			}
		], 
		{path: 'dbs/plan-simple-brave/1', timeout: 1000 * 60 * 60}
	));

	xit("Solve Brave Puzzle", test(
		`
		$LETTER = {B R A V E}
		$N = {1 2 3 4 5}



		$BRAVE = {'s | 
			('l1:$LETTER 'x:$N 'y:$N) in 's, 
			('l2:$LETTER 'x1:$N 'y:$N) in 's, 'x != 'x1, 'l1 != 'l2, # line
			('l3:$LETTER 'x:$N 'y1:$N) in 's, 'y != 'y1, 'l1 != 'l3,  # col			
		}

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
});


