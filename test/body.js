"use strict";

const test = require("../test-utils/test");

describe("Body Tests", () => {
    it("should use body on definitions",
        test(
            `
                ('x != ~'x) 
                ('x:{0 1} & 'x = 'x)
                ('x & 'y = 0) {('x:{0 1} != 'y:{0 1})}                
            `, [{
                query: `('p & 'q = 'z)`,
                results: [
                    "@('p:{0 1} & 'p:{0 1} = 'p:{0 1})",
                    "@(0 & 1 = 0)",
                    "@(1 & 0 = 0)"
                ]
            }],
            {path: 'dbs/body/1', timeout: 2000 * 30}
        )
    ),

    it("should use body on query",
        test(
            `
                ('x = 'x)
                ('x & 'x = 'x)
                ('x & ~'x = 0)
            `, [{
                query: `('p & 'q = 'z) {
                    ('p = '{0 1}) 
                    ('q = '{0 1}) 
                    ('z = '{0 1})
                }`,
                results: [
                    "@('p:{0 1} & 'p:{0 1} = 'p:{0 1})",
                    "@(0 & 1 = 0)",
                    "@(1 & 0 = 0)"                                          
                ]
            }],
            {path: 'dbs/body/2', timeout: 2000 * 30}
        )
    )

});