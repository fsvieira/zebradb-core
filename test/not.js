"use strict";

const test = require("../test-utils/test");

describe("Not Tests.", () => {

	/*
	const ztl = new ZTL();
	ztl.compile(`
		number:
			(number 'n) -> 'n.

		set:
			(set 'i (set) ') -> "" 'i | number,
			(set 'i 'tail ') -> "" 'i | number ", " 'tail | set,
			(set) -> "".

		setStart:
			(set 'i (set) ') -> "[" 'i | number "]\n",
			(set 'i 'tail ') -> "[" 'i | number ", " 'tail | set "]\n".
	`);

	const setStart = (r) => ztl.fn.setStart(r);
	*/
	const setArray = r => {
		if (r.t.length > 1) {
			const {
				t: [
				_set,
				{
					t: [
						_set2,
						{c: value}
						]
					},
					next
				]
			} = r;
	
			return [+value].concat(setArray(next));	
		}
		else {
			return [];
		}

	}
	;

	const setStart = r => `[${setArray(r).join(", ")}]`;

	it("Simple not",
		test(
			`('x = 'x)
			 ('x != ~'x)
			`, [
				{
					query: "(blue 'o pink)",
					results: ["@(blue != pink)"]
				},
				{
					query: "(blue 'o blue)",
					results: ["@(blue = blue)"]
				},
				{
					query: "(~blue 'o blue)",
					results: ["@('_v1~{blue} != blue)"]
				},
				{
					query: "('x != 'x)", 
					results: []
				},
				{
					query: "('x = ~'x)", 
					results: []
				}
			],
			{
				path: 'dbs/not/1', 
				timeout: 1000 * 60 * 60
			}
		)
	);

	xit("Simple not invert order",
		test(
			`('x = 'x)
			(~'x != 'x)
			`, [
				{
					query: "(blue 'o pink)",
					results: ["@(blue != pink)"]
				},
				{
					query: "(blue 'o blue)",
					results: ["@(blue = blue)"]
				},
				{
					query: "(~blue 'o blue)",
					results: ["@('_v1~{blue} != blue)"]
				},
				{
					query: "('x != 'x)", 
					results: []
				}
			],
			{path: 'dbs/not/2', timeout: 2000}
		)
	);

	xit("Simple not varnames",
		test(
			`('x:{0 1} 'y~'x 'y:{0 1})
			`, [
				{
					query: "('x 'y 'z)",
					results: [ 
						"@(0 1 1)",
						"@(1 0 0)"
			  		]
				}
			],
			{path: 'dbs/not/3', timeout: 1000 * 60 * 60}
		)
	);

	xit("Simple cascanding not varnames, TODO: solve circular",
		test(
			`('x:{0 1 3}~'y~'z~'x 'y:{0 1 3} 'z:{0 1 3})
			`, [
				{
					query: "('x 'y 'z)",
					results: [ 
						"@(0 1 1)",
						"@(1 0 0)"
			  		]
				}
			],
			{path: 'dbs/not/4', timeout: 1000 * 60 * 60}
		)
	);

	xit("Simple not multiple varnames",
		test(
			`('x:{0 1 3}~{'y~'z 'z} 'y:{0 1 3} 'z:{0 1 3})
			`, [
				{
					query: "('x 'y 'z)",
					results: [ 
						"@(0 1 3)", 
						"@(0 3 1)", 
						"@(1 0 3)", 
						"@(1 3 0)", 
						"@(3 0 1)", 
						"@(3 1 0)"
			  		]
				}
			],
			{path: 'dbs/not/5', timeout: 1000 * 60 * 60}
		)
	);

	xit("Simple tuple negation",
		test(
			"(not-blue-tuple ~(blue)) (pink) (blue)", [{
				query: "(not-blue-tuple ('x))",
				results: [
					"@(not-blue-tuple @(pink))"
				]
			}],
			{path: 'dbs/not/6', timeout: 2000}
		)
	);

	xit("Not evaluation order",
		test(
			"('x = 'x) ('x)", [{
				query: "((~blue) = (yellow))",
				results: [
					"@(@(yellow) = @(yellow))"
				]
			}],
			{path: 'dbs/not/7', timeout: 1000 * 60 * 60}
		)
	);

	xit("Declare a not equal",
		test(
			`(color 'a)
			 ('x = 'x)
			 ('x != ~'x)
			`, [{
				query: "(yellow = yellow)",
				results: [
					"@(yellow = yellow)"
				]
			},
			{
				query: "(yellow = blue)",
				results: []
			},
			{
				query: "(yellow != yellow)",
				results: []
			},
			{
				query: "(yellow != blue)",
				results: [
					"@(yellow != blue)"
				]
			},
			{
				query: "((color yellow) != (color yellow))",
				results: []
			},
			{
				query: "((color blue) != (color yellow))",
				results: [
					"@(@(color blue) != @(color yellow))"
				]
			}
			],
			{path: 'dbs/not/8', timeout: 1000 * 60 * 60}
		)
	);

	xit("Should make distinct tuples",
		test(
			`(color yellow)
            (color blue)
            (color red)
            (distinct 'x ~'x)
			`,
			[
				{
					query: "(distinct (color yellow) (color yellow))",
					results: []
				},
				{
					query: "(distinct (color yellow) (color blue))",
					results: [
						"@(distinct @(color yellow) @(color blue))"
					]
				},
				{
					query: "(distinct (color 'a) (color 'b))",
					results: [
						"@(distinct @(color blue) @(color red))",
						"@(distinct @(color blue) @(color yellow))",
						"@(distinct @(color red) @(color blue))",
						"@(distinct @(color red) @(color yellow))",
						"@(distinct @(color yellow) @(color blue))",
						"@(distinct @(color yellow) @(color red))"
					]
				}
			],
			{path: 'dbs/not/9', timeout: 1000 * 60 * 60}
		)
	);

	xit("Should declare simple not.",
		test(
			`(number 0)
            (number 1)
            (not 'x ~'x)
            `, [{
				query: "(not (number 'p) (number 'q))",
				results: [
					"@(not @(number 0) @(number 1))",
      				"@(not @(number 1) @(number 0))"
				]
			}],
			{path: 'dbs/not/10', timeout: 1000 * 60 * 60}
		)
	);

	xit("Should declare a list",
		test(
			`(list)
            (list 'item (list ' '))
            (list 'item (list))

            (fruit banana)
            (fruit strawberry)
            (fruit apple)
            (fruit papaya)
            `, [
				{
					query: "(list)",
					results: [
						"@(list)"
					]
				},
				{
					query: "(list (fruit banana) (list (fruit apple) (list)))",
					results: [
						"@(list @(fruit banana) @(list @(fruit apple) @(list)))"
					]
				},
				{
					query: "(list (fruit 'a) (list (fruit ~'a) (list)))",
					results: [
						'@(list @(fruit apple) @(list @(fruit banana) @(list)))',
						'@(list @(fruit apple) @(list @(fruit papaya) @(list)))',
						'@(list @(fruit apple) @(list @(fruit strawberry) @(list)))',
						'@(list @(fruit banana) @(list @(fruit apple) @(list)))',
						'@(list @(fruit banana) @(list @(fruit papaya) @(list)))',
						'@(list @(fruit banana) @(list @(fruit strawberry) @(list)))',
						'@(list @(fruit papaya) @(list @(fruit apple) @(list)))',
						'@(list @(fruit papaya) @(list @(fruit banana) @(list)))',
						'@(list @(fruit papaya) @(list @(fruit strawberry) @(list)))',
						'@(list @(fruit strawberry) @(list @(fruit apple) @(list)))',
						'@(list @(fruit strawberry) @(list @(fruit banana) @(list)))',
						'@(list @(fruit strawberry) @(list @(fruit papaya) @(list)))'
					]
				}
			],
			{path: 'dbs/not/11', timeout: 1000 * 60 * 60}
		)
	);

	xit("Should declare a two number Set",
		test(
			`(number 0)
            (number 1)
            (set)
            (set (number 'a) (set) ')
            (set (number 'a) (set (number ~'a) 'tail ') (set (number 'a) 'tail '))
			`, [{
				query: `
    			    (set
        			    (number 'a)
        			    (set (number 'b) (set) ')
        			')
				`,
				process: setStart,
				results: [
					"[0, 1]",
      				"[1, 0]"
				]
			},
			{
				query: `
    					(set (number 'a)
    						(set (number 'b)
    						(set (number 'c) (set) ') ')
    					')
					`,
				process: setStart,
				results: []
			}
			],
			{path: 'dbs/not/12', timeout: 1000 * 60 * 60}
		)
	);

	xit("Should declare a two number Set, query all",
		test(
			`(number 0)
            (number 1)
            (set)
            (set (number 'a) (set) ')
            (set (number 'a) (set (number ~'a) 'tail ') (set (number 'a) 'tail '))
			`, [{
				query: "(set (number 'a) 'tail ')",
				process: setStart,
				results: [
					"[0, 1]",
					"[0]",
					"[1, 0]",
					"[1]"
			  ]
			}],
			{path: 'dbs/not/13', timeout: 1000 * 60 * 60}
		)
	);

	xit("Should declare a number Set, 3 elements",
		test(
			`(number 0)
            (number 1)
            (number 2)
            (set)
            (set (number 'a) (set) ')
            (set (number 'a) (set (number ~'a) 'tail ') (set (number 'a) 'tail '))
            `, [{
				query: `(set (number 0)
	                    (set (number 1)
	                    (set (number 2) (set) ') ')
					')`,
				process: setStart,
				results: [
					"[0, 1, 2]"
				]
			},
			{
				query: "(set (number 'a) 'tail ')",
				process: setStart,
				results: [
					'[0, 1, 2]',
					'[0, 1]',
					'[0, 2, 1]',
					'[0, 2]',
					'[0]',
					'[1, 0, 2]',
					'[1, 0]',
					'[1, 2, 0]',
					'[1, 2]',
					'[1]',
					'[2, 0, 1]',
					'[2, 0]',
					'[2, 1, 0]',
					'[2, 1]',
					'[2]'
				]
			}
			],
			{path: 'dbs/not/14', timeout: 1000 * 60 * 60}
		)
	);

	xit("Should declare a number Set, 4 elements",
		test(
			`(number 0)
            (number 1)
            (number 2)
            (number 3)
            (set)
            (set (number 'a) (set) ')
            (set (number 'a) (set (number ~'a) 'tail ') (set (number 'a) 'tail '))
			`, [{
				query: `(set (number 0)
		                (set (number 1)
		                (set (number 2)
		                (set (number 3) (set) ') ') ')
					')`,
				process: setStart,
				results: ["[0, 1, 2, 3]"]
			},
			{
				query: `(set (number 'a)
		                (set (number 'b)
		                (set (number 'c)
		                (set (number 'd) (set) ') ') ')
					')`,
				process: setStart,
				results: [
					'[0, 1, 2, 3]',
					'[0, 1, 3, 2]',
					'[0, 2, 1, 3]',
					'[0, 2, 3, 1]',
					'[0, 3, 1, 2]',
					'[0, 3, 2, 1]',
					'[1, 0, 2, 3]',
					'[1, 0, 3, 2]',
					'[1, 2, 0, 3]',
					'[1, 2, 3, 0]',
					'[1, 3, 0, 2]',
					'[1, 3, 2, 0]',
					'[2, 0, 1, 3]',
					'[2, 0, 3, 1]',
					'[2, 1, 0, 3]',
					'[2, 1, 3, 0]',
					'[2, 3, 0, 1]',
					'[2, 3, 1, 0]',
					'[3, 0, 1, 2]',
					'[3, 0, 2, 1]',
					'[3, 1, 0, 2]',
					'[3, 1, 2, 0]',
					'[3, 2, 0, 1]',
					'[3, 2, 1, 0]'				  
				]
			}
			], 
			{path: 'dbs/not/15', timeout: 1000 * 60 * 60}
		)
	);

	xit("Should declare a number Set, 4 elements, all",
		test(
			`(number 0)
            (number 1)
            (number 2)
            (number 3)
            (set)
            (set (number 'a) (set) ')
            (set (number 'a) (set (number ~'a) 'tail ') (set (number 'a) 'tail '))
            `, [{
				query: "(set (number 'a) 'tail ')",
				process: setStart,
				results: [
					"[0, 1, 2, 3]",
					"[0, 1, 2]",
					"[0, 1, 3, 2]",
					"[0, 1, 3]",
					"[0, 1]",
					"[0, 2, 1, 3]",
					"[0, 2, 1]",
					"[0, 2, 3, 1]",
					"[0, 2, 3]",
					"[0, 2]",
					"[0, 3, 1, 2]",
					"[0, 3, 1]",
					"[0, 3, 2, 1]",
					"[0, 3, 2]",
					"[0, 3]",
					"[0]",
					"[1, 0, 2, 3]",
					"[1, 0, 2]",
					"[1, 0, 3, 2]",
					"[1, 0, 3]",
					"[1, 0]",
					"[1, 2, 0, 3]",
					"[1, 2, 0]",
					"[1, 2, 3, 0]",
					"[1, 2, 3]",
					"[1, 2]",
					"[1, 3, 0, 2]",
					"[1, 3, 0]",
					"[1, 3, 2, 0]",
					"[1, 3, 2]",
					"[1, 3]",
					"[1]",
					"[2, 0, 1, 3]",
					"[2, 0, 1]",
					"[2, 0, 3, 1]",
					"[2, 0, 3]",
					"[2, 0]",
					"[2, 1, 0, 3]",
					"[2, 1, 0]",
					"[2, 1, 3, 0]",
					"[2, 1, 3]",
					"[2, 1]",
					"[2, 3, 0, 1]",
					"[2, 3, 0]",
					"[2, 3, 1, 0]",
					"[2, 3, 1]",
					"[2, 3]",
					"[2]",
					"[3, 0, 1, 2]",
					"[3, 0, 1]",
					"[3, 0, 2, 1]",
					"[3, 0, 2]",
					"[3, 0]",
					"[3, 1, 0, 2]",
					"[3, 1, 0]",
					"[3, 1, 2, 0]",
					"[3, 1, 2]",
					"[3, 1]",
					"[3, 2, 0, 1]",
					"[3, 2, 0]",
					"[3, 2, 1, 0]",
					"[3, 2, 1]",
					"[3, 2]",
					"[3]"
				]
			}], 
			{path: 'dbs/not/16', timeout: 1000 * 60 * 60}
		)
	);

	xit("Simple not with bound varnames at negation constrains", 
		test(`
			('x = 'x)
			('x~{'y ('y = 1)})
		`, [
				{
					query: "('x)",
					results: [ 
			  		]
				}
			],
			{path: 'dbs/not/17', timeout: 1000 * 60 * 60}
		)
	)

	xit("Complex not with contradictions", 
		test(`
			('x = 'x)
			
			/* 
				This is the same as 'x != 'x, 
				This should fail.
			*/
			('x~{'y ('y = 'x)})
		`, [
				{
					query: "('x)",
					results: []
				}
			],
			{path: 'dbs/not/17', timeout: 1000 * 60 * 60}
		)
	)

});
