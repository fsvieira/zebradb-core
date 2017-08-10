const test = require("../lib/testing/test");

describe('Get the max solution.', function() {
    xit('Declare a number set, get the max number set with all elements.',
        test(
            `(number 0)
            (number 1)
            (number 2)
            
            (equal 'x 'x)

            (set)
            (set (number 'a) (set) ')
            (set (number 'a) (set (number 'b) 'tail ') (set (number 'a) 'tail ') ^(equal (number 'a) (number 'b)))
            
            (max (set 'i 'tail 'p) ^(set ' (set 'i 'tail 'p) '))

            ?(max ')`
            ,
            ``
            ,
            {timeout: 60000 * 5}
        )
    );
});

