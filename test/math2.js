"use strict";

const test = require("../test-utils/test");

describe("Math 2 Tests", () => {
    it("should define add bases", 
        test(`
            ('a + 'b)

            ((0 + 0) = 0)
            ((1 + 0) = 1)
            ((0 + 1) = 1)

            #(('x:{0 1 2 3 4 5 6 7 8 9} + 0) <=> 'x)
            #((0 + 'x:{0 1 2 3 4 5 6 7 8 9}) <=> 'x)

            #(('a + 'b) + 'c)
            #('a + ('b + 'c))
            ('x := 'x)
            
            (('a + 'b) <=> ('c + ('d + 'e))) {
                (('d + 'e) = 'r)
                (('c + 'r) = 't)
                (('a + 'b) = 't)
            }

        `, [{
            query: `
                ((1 + 0) <=> 'z)
            `,
            results: [
                "@(@(1 + 0) <=> @(0 + @(0 + 1)))",
                "@(@(1 + 0) <=> @(0 + @(1 + 0)))",
                "@(@(1 + 0) <=> @(1 + @(0 + 0)))"
            ]
        }], 
        { 
            timeout: 60000 * 35,
            path: 'dbs/math2/1'
        })
    )
    
})

