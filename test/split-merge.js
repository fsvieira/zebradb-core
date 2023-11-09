"use strict";

const test = require("../test-utils/test");

describe("Splite Merge.", () => {
	it("should return set results on a set.",
		test(
            `
                $N = {1 2 3}
                $SM = {('a:$N 'b:$N) | 'a != 'b}
            `,
            [
                {
                    query: `('x 'y):$SM`,
                    results: [
                    ]
                }
            ],
            {
                timeout: 1000 * 60,
                path: 'dbs/split-merge/1.db'
			}
        )
    )
});
