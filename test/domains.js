"use strict";

const test = require("../test-utils/test");

describe("Test domains.", () => {
	it("should be a easy domain",
		test(
            `
            (number 'n) where 'n in {0 1 2 3} end
            `, [{
				query: `(number 'a)`,
				results: [
					"@(number 'a:{0 1 2 3})"
				]
			}],
			{
				timeout: 1000 * 60 * 5,
				path: 'dbs/domains/1'
			}
		)
	);

	it("should unify constant * domain",
		test(
			`
			(const 'c) where 'c in {0 1} end 
			`, [
				{
					query: `(const 0)`,
					results: [
						"@(const 0)"
					]
				},
				{
					query: `(const 2)`,
					results: []
				}
			],
			{
				timeout: 1000 * 60 * 5,
				path: 'dbs/domains/2'
			}
		)
	);

	it("should make domain of two variables",
		test(
			`
			('x = 'x)
            (number 'n) where 'n in {0 1 2 3} end 
			((number 'x) (number 'y))
			`, 
			[
				{
					query: "((number 'x) (number 'y))",
					results: [
						"@(@(number 'x:{0 1 2 3}) @(number 'y:{0 1 2 3}))",
					]
				},
				{
					query: "((number 'x) (number ~'x))",
					results: [
						"@(@(number 0) @(number 1))",
						"@(@(number 0) @(number 2))",
						"@(@(number 0) @(number 3))",
						"@(@(number 1) @(number 0))",
						"@(@(number 1) @(number 2))",
						"@(@(number 1) @(number 3))",
						"@(@(number 2) @(number 0))",
						"@(@(number 2) @(number 1))",
						"@(@(number 2) @(number 3))",
						"@(@(number 3) @(number 0))",
						"@(@(number 3) @(number 1))",
						"@(@(number 3) @(number 2))"
					  
					]
				}
			],
			{
				timeout: 1000 * 60 * 5,
				path: 'dbs/domains/3'
			}
		)
	);

	it("should declare AND booelan operator using domains. (simple)",
		test(
			`
				('a & 0 = 0) where 'a in {0 1} end
				( 0 & 'a = 0) where 'a in {0 1} end
				( 1 & 1 = 1)
			`, [
				{
					query: "('a & 'b = 'c)",
					results: [
						"@('a:{0 1} & 0 = 0)",
				      	"@(0 & 'b:{0 1} = 0)",
      					"@(1 & 1 = 1)"
					]
				},
				{
					query: "(1 & 'b = 'c)",
					results: [
						"@(1 & 0 = 0)",
						"@(1 & 1 = 1)"
					]
				},
				{
					query: "('a & 1 = 'c)",
					results: [
						"@(0 & 1 = 0)",
						"@(1 & 1 = 1)"
					]
				}
			],
			{
				timeout: 1000 * 60 * 5,
				path: 'dbs/domains/4'
			}
		)
	);

	it("should declare AND booelan operator using domains. (simple domains names)",
		test(
			`
				('x != ~'x)
				('x & 'x = 'x ') where 'x in {0 1} end
				('x & 'y = 0 ('x != 'y)) where 
					'x in {0 1}
					'y in {0 1} 
				end
			`, [
				{
					query: "('a & 'b = 'c ')",
					results: [
						"@('a:{0 1} & 'a:{0 1} = 'a:{0 1} 'v$2)",
						"@(0 & 1 = 0 @(0 != 1))",
						"@(1 & 0 = 0 @(1 != 0))"
					]
				  
				}
			],
			{
				timeout: 1000 * 60 * 5,
				path: 'dbs/domains/5'
			}
		)
	);

	it("should declare AND booelan operator using domains. (fancy)",
		test(
			`
			('x & 'y = 'z ('y & 'x = 'z stop))
			('x & 0 = 0 ') where 'x in {0 1} end 
			(1 & 1 = 1 ')
			`, [
				{
					query: "('a & 'b = 'c ')",
					results: [
						"@('a:{0 1} & 0 = 0 'v$2)",
						"@(0 & 'b:{0 1} = 0 @('b:{0 1} & 0 = 0 stop))",
						"@(1 & 1 = 1 'v$2)",
						"@(1 & 1 = 1 @(1 & 1 = 1 stop))"
					]
				},
				{
					query: "(1 & 'b = 'c ')",
					results: [
						"@(1 & 0 = 0 'v$2)",
						"@(1 & 1 = 1 'v$2)",
						"@(1 & 1 = 1 @(1 & 1 = 1 stop))"
					]
				},
				{
					query: "('a & 1 = 'c ')",
					results: [
						"@(0 & 1 = 0 @(1 & 0 = 0 stop))",
						"@(1 & 1 = 1 'v$2)",
						"@(1 & 1 = 1 @(1 & 1 = 1 stop))"
					]
				}
			],
			{
				timeout: 1000 * 60 * 5,
				path: 'dbs/domains/6'
			}
		)
	);

	it("should declare AND booelan operator using domains. (fancy 2)",
		test(
			`
				('x & ~'x = 0)
				('x & 'x = 'x)
			`, [
				{
					query: `
						('a & 'b = 'c) where 
							'a in {0 1} 
							'b in {0 1} 
						end`,
					results: [
						"@('a:{0 1} & 'a:{0 1} = 'a:{0 1})",
      					"@(0 & 1 = 0)",
      					"@(1 & 0 = 0)"
					]
				},
				{
					query: `(1 & 'x = 'c) where
							'x in {0 1}
						end
					`,
					results: [
						"@(1 & 0 = 0)",
						"@(1 & 1 = 1)"
					]
				}
			],
			{
				timeout: 1000 * 60 * 5,
				path: 'dbs/domains/7'
			}
		)
	);

	it("should create domains cartasian product result",
		test(
			`
			(bit 'x) where 'x in {0 1} end
			(list)
            (list (bit 'x) (list ' '))
			(list (bit 'x) (list))
			`, [{
				query: "(list 'x (list 'y (list)))",
				results: [
				  	"@(list @(bit 'v$11::x:{0 1}) @(list @(bit 'v$7::x:{0 1}) @(list)))"
				]
			}],
			{
				timeout: 1000 * 60 * 5,
				path: 'dbs/domains/8'
			}
		)
	);

	it("should create domains cartesian product result (unfold)",
		test(
			`
			(bit 'x) where 'x in {0 1} end
			(unfold 0 (bit 'a) ')
			(unfold 1 (bit 'b) (unfold 0 ' '))
			(unfold 2 (bit 'c) (unfold 1 ' '))
			`, [{
				query: "(unfold 2 ' ')",
				results: [
					// 0 0 0
					// 0 0 1
					// 0 1 0
					// 0 1 1
					// 1 0 0
					// 1 0 1
					// 1 1 0
					// 1 1 1
					"@(unfold 2 @(bit 'v$4::c:{0 1}) @(unfold 1 @(bit 'v$12::b:{0 1}) @(unfold 0 @(bit 'v$20::a:{0 1}) 'v$15::v$5)))"
				]
			}],
			{
				timeout: 1000 * 60 * 5,
				path: 'dbs/domains/9'
			}
		)
	);

	it("should handle domains negations.",
		test(
			`
			('x != ~'x)
			(2bits 'a 'b)
			(bit 'x) where 'x in {0 1} end
			`, [
				{
					query: `('a != 'b) where
							'a in {0 1}
							'b in {0 1} 
						end`,
					results: [
						"@(0 != 1)",
						"@(1 != 0)"
					]
				},
				{
					query: "(2bits (bit 'x) (bit ~'x))",
					results: [
						"@(2bits @(bit 0) @(bit 1))",
						"@(2bits @(bit 1) @(bit 0))"					
					]
				},
				{
					query: "((bit 'x) != (bit 'y))",
					results: [
						"@(@(bit 0) != @(bit 1))",
						"@(@(bit 1) != @(bit 0))"
					]
				}
			],
			{
				timeout: 1000 * 60 * 5,
				path: 'dbs/domains/10'
			}
		)
	);

});

