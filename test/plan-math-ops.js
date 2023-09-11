"use strict";

const test = require("../test-utils/test");

describe("Plan Math graphs.", () => {
	it("Plan Math Ops", test(
		`
            $MATH_ADD = { (('a + 'b) = 'c) | 'c = 'a + 'b } 

            $MATH_RULES = {
                ('a + 'b) <=> ('b + 'a)
                ('x = 'y) <=> ('y = 'x)
                (('a + 'b) + 'c) <=> ('a + ('b + 'c)) 
                ('c = ('a + 'b)) <=> ('b = ('c - 'a)) <=> ('a = ('c - 'b)) 
            }
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


