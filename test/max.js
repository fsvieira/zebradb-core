const test = require("../lib/testing/test");

describe('Get the max solution.', function() {
    it('Declare a number set, get the max number set with all elements.',
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
            `
            ?(max '):
            	@(max @(set @(number 0) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) '))))[^!(equal @(number 0) (number 2)) !(equal @(number 0) @(number 1)) !(equal @(number 1) (number 2)) !(set ' @(set @(number 0) @(set @(number 1) (set (number 2) @(set) ') (set @(number 1) @(set) ')) @(set @(number 0) (set (number 2) @(set) ') @(set @(number 0) @(set) '))) ')]
            	@(max @(set @(number 0) @(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) '))))[^!(equal @(number 0) (number 1)) !(equal @(number 0) @(number 2)) !(equal @(number 2) (number 1)) !(set ' @(set @(number 0) @(set @(number 2) (set (number 1) @(set) ') (set @(number 2) @(set) ')) @(set @(number 0) (set (number 1) @(set) ') @(set @(number 0) @(set) '))) ')]
            	@(max @(set @(number 1) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) '))))[^!(equal @(number 0) (number 2)) !(equal @(number 1) (number 2)) !(equal @(number 1) @(number 0)) !(set ' @(set @(number 1) @(set @(number 0) (set (number 2) @(set) ') (set @(number 0) @(set) ')) @(set @(number 1) (set (number 2) @(set) ') @(set @(number 1) @(set) '))) ')]
            	@(max @(set @(number 1) @(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) '))))[^!(equal @(number 1) (number 0)) !(equal @(number 1) @(number 2)) !(equal @(number 2) (number 0)) !(set ' @(set @(number 1) @(set @(number 2) (set (number 0) @(set) ') (set @(number 2) @(set) ')) @(set @(number 1) (set (number 0) @(set) ') @(set @(number 1) @(set) '))) ')]
            	@(max @(set @(number 2) @(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) '))))[^!(equal @(number 0) (number 1)) !(equal @(number 2) (number 1)) !(equal @(number 2) @(number 0)) !(set ' @(set @(number 2) @(set @(number 0) (set (number 1) @(set) ') (set @(number 0) @(set) ')) @(set @(number 2) (set (number 1) @(set) ') @(set @(number 2) @(set) '))) ')]
            	@(max @(set @(number 2) @(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) '))))[^!(equal @(number 1) (number 0)) !(equal @(number 2) (number 0)) !(equal @(number 2) @(number 1)) !(set ' @(set @(number 2) @(set @(number 1) (set (number 0) @(set) ') (set @(number 1) @(set) ')) @(set @(number 2) (set (number 0) @(set) ') @(set @(number 2) @(set) '))) ')]
            `
            ,
            {timeout: 60000 * 5}
        )
    );
});

