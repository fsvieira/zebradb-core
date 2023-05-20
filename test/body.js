"use strict";

const test = require("../test-utils/test");

describe("Body Tests", () => {
    it("should use body on definitions, simple",
        test(
            `
                ('x) where 
                    'x in {0 1 2} 
                    'x in {1 2 3} # Union if x in A or x in B, so this should be a intersection 
                end
            `, [{
                query: `('x)`,
                results: [
                    "@('x:{1 2})"
                ]
            }],
            {path: 'dbs/body/1', timeout: 2000 * 30}
        )
    ),

    it("should use body on definitions",
        test(
            `
                ('x != ~'x) 
                ('x & 'x = 'x) where 'x in {0 1} end
                ('x & 'y = 0) where 
                    'x in {0 1}
                    'y in {0 1}
                    ('x != 'y) 
                end
            `, [{
                query: `('p & 'q = 'z)`,
                results: [
                    "@('p:{0 1} & 'p:{0 1} = 'p:{0 1})",
                    "@(0 & 1 = 0)",
                    "@(1 & 0 = 0)"
                ]
            }],
            {path: 'dbs/body/2', timeout: 2000 * 30}
        )
    ),

    it("should use body on query",
        test(
            `
                ('x & 'x = 'x)
                ('x & ~'x = 0)
            `, [{
                query: `('p & 'q = 'z) where
                    'p in {0 1}
                    'q in {0 1}
                    'z in {0 1}
                end`,
                results: [
                    "@('p:{0 1} & 'p:{0 1} = 'p:{0 1})",
                    "@(0 & 1 = 0)",
                    "@(1 & 0 = 0)"                                          
                ]
            }],
            {path: 'dbs/body/3', timeout: 2000 * 30}
        )
    )

});