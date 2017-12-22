"use strict";

const test = require("../lib/testing/test");

describe("Inifinity tests.", function () {
    it("Should declare natural numbers and query all natural numbers",
        test(
            `(nat 0) (nat (nat 'x))
            ?(nat 'x)`,
            
            `?(nat 'x): 
                @(nat 0) 
                @(nat @(nat 0)) 
                @(nat @(nat @(nat 0)))
            `,
            {depth: 5}
        )
    );

    it("Should declare recursive tuples",
        /*
            A = B
            B = A
        */
        test(
            `(a (b 'a)) (b (a 'b)) ('x stop)
            ?(a 'b)`,

            `?(a 'b):
                @(a @(b @(a @(b @(a stop)))))
                @(a @(b @(a @(b stop))))
                @(a @(b @(a stop)))
                @(a @(b stop))
                @(a stop)
            `,
            {depth: 7}
        )
    );

});
