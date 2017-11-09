const testPlanner = require("../../lib/testing/test_planner");
const test = require("../../lib/testing/test");

describe('Planner Tests - test for best planner choices.', function () {
    it('should return unique solution.',
        testPlanner(
            `
            (yellow)
            ?('x)`
            ,
            `{@(yellow)}`
        )
    );
    
    it('should unify choose zero unification.',
        testPlanner(
            `
            (nat 0)
            (nat (nat 'x))
            (zero 0)
            (test 'a 'b)
            ?(test (zero 'x) (nat 'x))`
            ,
            `{(test @(zero 0) (nat 0))}
            {@(test (zero 'x) (nat 'x))}`
        )
    );
    
    it('should ',
        testPlanner(
            `
            (bin 0)
            (bin 1)

            (equal 'x 'x)
            
            (set)
            (set 'a (set) ')
            (set 'a (set 'b 'tail ') (set 'a 'tail ') ^(equal 'a 'b))
    
            (test
                (bin 'a) 
                (bin 'b)
                (set 'a (set 'b (set) ') ')
            )


            ?(test
                (bin 'a) 
                (bin 'b)
                (set 'a (set 'b (set) ') ')
            )`
            ,
            `{(test (bin 'a) (bin 'b) (set 'a (set 'b @(set) ') '))}
             {(test (bin 'a) (bin 'a) (set 'a @(set 'a (set) ') '))}
             {(test (bin 'a) (bin 'b) @(set 'a (set 'b (set) ') (set 'a (set) ')))[^(equal 'a 'b)]}
             {@(test (bin 'a) (bin 'b) (set 'a (set 'b (set) ') '))}
            `
        )
    );

    it('should ',
        testPlanner(
            `
            (d 0)
            (d 1)
            (d 2)
            
            (equal 'x 'x)
            
            (set)
            (set 'a (set) ')
            (set 'a (set 'b 'tail ') (set 'a 'tail ') ^(equal 'a 'b))
    
            (test
                (d 'a) 
                (d 'b)
                (d 'c)
                (set 'a (set 'b (set 'c (set) ') ') ')
            )


            ?(test
                (d 'a)
                (d 'b)
                (d 'c)
                (set 'a (set 'b (set 'c (set) ') (set 'b (set) ')) ')
            )`
            ,
            `{(test (d 'a) (d 'a) (d 'c) (set 'a (set 'a (set 'c (set) ') @(set 'a (set) ')) '))}
             {(test (d 'a) (d 'b) (d 'c) (set 'a (set 'b (set 'c @(set) ') (set 'b @(set) ')) '))}
             {(test (d 'a) (d 'b) (d 'a) (set 'a (set 'b @(set 'a (set) ') (set 'b (set) ')) '))}
             {(test (d 'a) (d 'a) (d 'b) (set 'a @(set 'a (set 'b (set) ') (set 'a (set) ')) '))[^(equal 'a 'b)]}
             {(test (d 'a) (d 'b) (d 'c) @(set 'a (set 'b (set 'c (set) ') (set 'b (set) ')) (set 'a (set 'c (set) ') ')))[^(equal 'a 'b)]}
             {@(test (d 'a) (d 'b) (d 'c) (set 'a (set 'b (set 'c (set) ') (set 'b (set) ')) '))}
            `
        )
    );
    it('should ',
        testPlanner(
            `
            (bin 0)
            (bin 1)

            (equal 'x 'x)
            
            (set)
            (set (bin 'a) (set) ')
            (set (bin 'a) (set (bin 'a) 'tail ') (set 'a 'tail ') ^(equal 'a 'b))
    
            ?(set (bin 'a) ' ')`
            ,
            `{(set @(bin 0) ' '); (set @(bin 1) ' ')}`
        )
    );
    
    it('should run bin set',
        test(
            `
            (bin 0)
            (bin 1)

            (equal 'x 'x)
            
            (set)
            (set (bin 'a) (set) ')
            (set (bin 'a) (set (bin 'b) 'tail ') (set (bin 'a) 'tail ') ^(equal 'a 'b))
    
            ?(set ' ' ')`
            ,
            `?(set ' ' '):
                @(set @(bin 0) @(set @(bin 1) @(set) ') @(set @(bin 0) @(set) '))[^!(equal 0 1)]
                @(set @(bin 0) @(set) ')
                @(set @(bin 1) @(set @(bin 0) @(set) ') @(set @(bin 1) @(set) '))[^!(equal 1 0)]
                @(set @(bin 1) @(set) ')
            `
        )
    );
});