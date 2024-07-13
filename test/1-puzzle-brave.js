"use strict";

const test = require("../test-utils/test");

describe("Brave Puzzle", () => {
	it("Brave Puzzle Defintion", test(
		`
			$LETTER = {B R A V E}
			$N = {1 2 3 4 5}

			$BRAVE = {
				{('l:$LETTER 'x:$N 'y:$N) |
					[ ['x = 'y and 'd1 = 101 ] or ['x != 'y and ['d1 = 'y * 5 + 'x]] ] 
					and 
					[ [['y = 6 - 'x] and 'd2 = 102 ] or [['y != 6 - 'x] and ['d2 = 'y * 5 + 'x]]]
				} 
				as 's,
				['x, 'y] is unique,
				['l, 'x] is unique, 
				['l, 'y] is unique,
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
                                                (E 3 5 ' ') (B 4 5 ' ') 
						... 
					}:$BRAVE ... 
				}`,
				results: [
					"@(2 = 1 + 1)" 
				]
			}
		], 
		{
			path: 'dbs/brave/def', 
			timeout: 1000 * 60 * 60,
			log: true
		}
	));
});


