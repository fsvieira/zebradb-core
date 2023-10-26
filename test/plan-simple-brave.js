"use strict";

const test = require("../test-utils/test");

describe("Plan Simple Puzzles", () => {
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

	it("Line Combinatorial", test(
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


