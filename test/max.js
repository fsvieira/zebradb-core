"use strict";

const test = require("../lib/testing/test");

describe("Get the max solution.", function() {
    it("Declare a number set, get the max number set with all elements.",
        test(
            `(number 0)
            (number 1)
            (number 2)
            
            (equal 'x 'x)

            (set)
            (set (number 'a) (set) ')
            (set (number 'a) (set (number 'b) 'tail ') (set (number 'a) 'tail ')
                ^(equal (number 'a) (number 'b))
            )
            
            (max (set 'i 'tail 'p) ^(set ' (set 'i 'tail 'p) '))

            number:
                (number 'n) -> 'n.
                
            set:
                (set 'i (set) ') -> "" 'i | number,
                (set 'i 'tail ') -> "" 'i | number ", " 'tail | set,
                (set) -> "".

            max:
                (max 'set) -> "[" 'set | set "]\n".
                

            ?(max ') | max

            # ?(max ')
            `,
            
            `?(max '):
                [0,1,2]
                [0,2,1]
                [1,0,2]
                [1,2,0]
                [2,0,1]
                [2,1,0]
            `,
            {timeout: 3000}
        )
    );
});

