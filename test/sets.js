"use strict";

const test = require("../test-utils/test");

describe("Play Tests.", () => {
	it("Sets AND (1)", test(
		`
			$AND = {
				(0 & 0 = 0)
				(0 & 1 = 0)
				(1 & 0 = 0)
				(1 & 1 = 1)
			}
		`, 
		[
			{
				query: "('x & 'y = 'z):$AND",
				results: [
					"@(0 & 0 = 0)", 
					"@(0 & 1 = 0)", 
					"@(1 & 0 = 0)", 
					"@(1 & 1 = 1)" 
				]
			},
		], 
		{path: 'dbs/sets/1', timeout: 1000 * 60}
	));

	xit("Sets AND (2)", test(
		`
			$BOOL = {true false}
			$AND_1 = {('x:$BOOL & 'x:$BOOL = 'x:$BOOL) |} 
			$AND_2 = {('a:$BOOL & 'b:$BOOL = false) | 'a != 'b }
			$AND = $AND_1 union $AND_2
		`, 
		[
			{
				query: "('x & 'y = 'z):$AND",
				results: [
					"@(0 & 0 = 0)", 
					"@(0 & 1 = 0)", 
					"@(1 & 0 = 0)", 
					"@(1 & 1 = 1)" 
				]
			},
		], 
		{path: 'dbs/sets/2', timeout: 1000 * 60}
	));

	xit("Sets 1", test(
		`
			(cell 'x 'y 'b) where 
				'x in {1 2}
				'y in {1 2}
				'b in {B R}
			end

			(test1 'a) where
				'a in (cell 'x 'y 'b)
			end

			(column (cell 'x 'y 'b) (cell 'x ~'y ~'b))
			(test2 's) where
				's = {('a 'b) ('c 'd) : (column 'a 'b) and (column 'a 'd) and (column 'c 'd) }
			end
		`, 
			[
				{
					query: "(test1 'a)",
					results: [
						"@(test1 @(cell 'v$5::x:{1 2} 'v$6::y:{1 2} 'v$7::b:{B R}))"
					]
				},
			], 
			{path: 'dbs/sets/1', timeout: 1000 * 60}
		)
	);

	xit("Sets 2", test(
		`
			(cell 'x 'y 'b) where 
				'x in {1 2}
				'y in {1 2}
				'b in {B R}
			end

			(column (cell 'x 'y 'b) (cell 'x ~'y ~'b))
			
			(test2 's) where
				's = {('a 'b) ('c 'd) : (column 'a 'b) and (column 'a 'd) and (column 'c 'd) }
			end
		`, 
			[
				{
					query: "(test2 'a)",
					results: [
						""
					]
				},
			], 
			{path: 'dbs/sets/1', timeout: 1000 * 60}
		)
	);

	xit("Sets 1", test(
		`
			(cell 'x 'y 'b) where 
				'x in {1 2 3 4 5}
				'y in {1 2 3 4 5}
				'b in {B R A V E}
			end

			let Cell = (cell 'x 'y 'b) where 
				'x in {1 2}
				'y in {1 2}
				'b in {B R}
			end

			(valid 'a:Cell 'b:Cell) where 
				
			end

			{(1 1 B) (1 1 R) (1 2 B) (1 2 R) (2 1 B) (2 1 R) (2 2 B) (2 2 R)}

			(valid-column 'a 'b) where
				'a in (cell 'x 'y 'v)
				'b in (cell 'x ~'y ~'v)
			end

			{
				((1 1 B) (1 2 R))
				((1 1 R) (1 2 B))

				((2 1 B) (2 2 R))
				((2 1 R) (2 2 B))
			}

			(games 'g) where 
				's = {'a, 'b : (valid-column 'a 'b)}
				's in 'g
			)

			(game 's) where 
				's = {'a, 'b : (valid-column 'a 'b)}
			)

			(games 'g) where 
				's in 'g 
				(' 'a 'b) in (valid-column ' ') 
				'a in 's
				'b in 's

				/*
				forall (' 'a 'b) in (valid-column ' ') , 'a in 's AND 'b in 's
				forall a, b in 's : (valid-column 'a 'b)

				yes, so they are not the same because on math notation the condition must 
				hold true for all sets elements , however the prolog version can add elements 
				to the set where there exists to elements that are are not valid-column 

				forall a, b in 's : (valid-column 'a 'b)

				*/
			end

			(valid-line 'a 'b) where
				'a in (cell 'x 'y 'v)
				'b in (cell ~'x 'y ~'v)
			end

			(games 'g) where 
				(' 'a 'b) in (valid-line ' ') 
				(' 'a 'b) in (valid-column ' ') 
				'a in 'g
				'b in 'g
			end

			/*
			(game 'l) where 
				'l subset (cell ' ' ')        # 'l is a set
				(cell 'x 'y 'b) in 'l         # (cell 'x 'y 'b) is an element of 'l
				(cell 'x 'x 'b) in 'l         # (cell 'x 'x 'b) is an element of 'l
				(cell 'x ~'y 'b) not-in 'l    # (cell 'x ~'y 'b) is not an element of 'l 
				(cell ~'x 'y 'b) not-in 'l    # (cell ~'x 'y 'b) is not an element of 'l
				(cell 'a~'x 'a 'b) not-in 'l  # (cell 'a~'x 'a 'b) is not an element of 'l 
			end*/			
		`, 
			[
				{
					query: "('x 'x 'b)",
					results: [
						"@('x:{1 2 3 4 5} 'x:{1 2 3 4 5} 'b:{A B E R V})"
					]
				}
			], 
			{path: 'dbs/sets/1'}
		)
	);

	xit("Sets",
		test(
			`
				('x != ~'x)
				(set)
				(set 'a (set))
				(set 'a (set 'b 'tail)) where
					(set 'a 'tail)
					('a != 'b)
				end

				('a in 's (set 'a 's))
				('a in (set 'a 'tail) (set 'a 'tail))
				('a in (set 'x 'tail) (set 'x 'tail)) where
					('a in 'tail 'tail)
					('a != 'x)
				end
			`, [
				{
					query: "(1 in (set) 'a)",
					results: ["@(1 in @(set) @(set 1 @(set)))"]
				}, 
				{
					query: "(1 in (set 1 (set)) 'a)",
					results: ["@(1 in @(set 1 @(set)) @(set 1 @(set)))"]
				},
				{
					query: "(1 in (set 2 (set 1 (set))) 'x)",
					results: ["@(1 in @(set 2 @(set 1 @(set))) @(set 2 @(set 1 @(set))))"]
				},
				{
					query: "(set 1 (set 2 (set 3 (set))))",
					results: ["@(set 1 @(set 2 @(set 3 @(set))))"]
				},
				/*{
					query: "(1 in 'x 'y)",
					results: ["@(1 in @(set) @(set 1 @(set)))"]
				}*/
			],
			{path: 'dbs/sets/1'}
		)
	);

	xit("Constrain Subset",
		test(
			`
				('x != ~'x)
				(set)
				(set 'a:{1 2 3} (set))
				(set 'a:{1 2 3} (set 'b:{1 2 3} 'tail)) where
					(set 'a 'tail)
					('a != 'b)
				end

				('a in 's (set 'a 's))
				('a in (set 'a 'tail) (set 'a 'tail))
				('a in (set 'x 'tail) (set 'x 'tail)) where
					('a in 'tail 'tail)
					('a != 'x)
				end

				('x subset 'w 'y) where
					('a in 'z 'x)
					('a in 'w 'y)
				end
			`, [
				{
					query: "((set 3 (set)) subset (set 2 (set 1 (set))) 'y)",
					results: [
						'@(@(set 3 @(set)) subset @(set 2 @(set 1 @(set))) @(set 3 @(set 2 @(set 1 @(set)))))',
						'@(@(set 3 @(set)) subset @(set 2 @(set 1 @(set))) @(set 3 @(set 2 @(set 1 @(set)))))'
					]
				},
				{
					query: "((set 1 (set)) subset (set 2 (set 1 (set))) 'y)",
					results: [
						"@(@(set 1 @(set)) subset @(set 2 @(set 1 @(set))) @(set 2 @(set 1 @(set))))",
  						"@(@(set 1 @(set)) subset @(set 2 @(set 1 @(set))) @(set 2 @(set 1 @(set))))"
					]
				},
				{
					query: "((set 4 (set)) subset (set 2 (set 1 (set))) 'y)",
					results: []
				},
				{
					query: "(set 'x (set 'y (set))) where ('x != !=) end",
					results: [
						"@(set 1 @(set 2 @(set)))",
						"@(set 1 @(set 3 @(set)))",
						"@(set 2 @(set 1 @(set)))",
						"@(set 2 @(set 3 @(set)))",
						"@(set 3 @(set 1 @(set)))",
						"@(set 3 @(set 2 @(set)))"
					]
				}
			],
			{path: 'dbs/sets/2', timeout: 1000 * 60 * 5}
		)
	);

	xit("Brave Set",
		test(
			`
				('x != ~'x)
				(brave-cell 'n:{B R A V E} 'x:{1 2 3 4 5} 'y:{1 2 3 4 5})

				(set)
				(set (brave-cell 'n 'x 'y) (set))
				(set (brave-cell 'n1 'x1 'y1) (set (brave-cell 'n2 'x2 'y2) 'tail)) where
					('n1 != 'n2)
					('x1 != 'x2)
					('y1 != 'y2)
				end

				('a in 's (set 'a 's))
				('a in (set 'a 'tail) (set 'a 'tail))
				('a in (set 'x 'tail) (set 'x 'tail)) where
					('a in 'tail 'tail)
					('a != 'x)
				end

				('x subset 'w 'y) where
					('a in 'z 'x)
					('a in 'w 'y)
				end

				(brave 'puzzle 'solution) where
					((brave-cell 'n 'x 'y) in 's2 's3)
					# ((brave-cell 'n ~'x 'y) in 's3 's4)
					((brave-cell 'n 'x ~'y) in 's4 's5)
					('puzzle subset 's5 'solution)
				end
			`, [
				{
					query: `(set (brave-cell 'n 'x 'y) (set (brave-cell 'n1 'x1 'y1) (set)))`,
					results: [
					]
				}
			],
			{path: 'dbs/sets/3', timeout: 1000 * 60 * 5}
		)
	);

	xit("Brave Sets.",
		test(
			`
			/*
				let B = {
					('n 'x 'y) ('n 'x2 'y) : 'x2 != 'x
				| ('n 'x 'y) ('n 'x 'y2) : 'y2 != 'y 
				| ('n 'x 'x) ('n 'y 'y) : 'x != 'y
			} where 'x 'y 'x2 'y2 \in {1..5} 'n \in {B R A V E}
			*/

			('x:{1, 2, 3, 4, 5} in 1..5)
			('x:{B R A V E} in BRAVE)

			(brave-cell 'n 'x 'y) {
				('x in 1..5)
				('y in 1..5)
				('n in BRAVE)
			}

			('a != 'b~'a)

            (set)
            (set 'a (set) ')
            (set 'a (set 'b 'tail ') (set 'a 'tail ')
                ('a != 'b)
            )

			(cond1
				(brave-cell 'n 'x 'y)
				(brave-cell 'n2 'x 'y2)
				(brave-cell 'n3 'x2 'y)
			) {
				('n != 'n2)
				('n != 'n3)
				('x != 'x2)
				('y != 'y2)
			}

			((brave-cell 'n 'x 'y) in 
				(set )
			)
			/*
			(cond2 
				(brave-cell 'n 'x 'x)
				(brave-cell 'n2 'y 'y)				
			) {
				('n != 'n2)
				('x != 'y)
			}

			(cond2)

			(brave-grid set 'x 'y 'z ) {
				(cond2 
			}*/

			
			`, [{
				query: "(yellow)",
				results: ["@(yellow)"]
			}],
			{path: 'dbs/sets/2'}
		)
	);
});
