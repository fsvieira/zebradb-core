"use strict";

const test = require("../test-utils/test");

describe("Plan Math graphs.", () => {
	it("Plan Math graphs: Undirected Graph", test(
		`
            $GRAPH_UNDIRECTED = {
                ('edges 'nodes) | 
                    ('u 'v) in 'edges,
                    'u in 'nodes,
                    'v in 'nodes
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
		{path: 'dbs/plan-math-graphs/1', timeout: 1000 * 60}
	));
});

