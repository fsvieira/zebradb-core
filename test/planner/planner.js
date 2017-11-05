const testPlanner = require("../../lib/testing/test_planner");

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
    
    /*
    it('should unify choose zero unification.',
        testPlanner(
            `
            (nat 0)
            (nat (nat 'x))
            (zero 0)
            (test 'a 'b)
            ?(test (zero 'x) (nat 'x))`
            ,
            `(zero 'x) ** [@(zero 0)]`
        )
    );*/

    it('should ',
        testPlanner(
            `
            (bin 0)
            (bin 1)
            
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
            `{@(test (bin 'a) (bin 'b) (set 'a (set 'b (set) ') '))}
             {(test (bin 'a) (bin 'b) @(set 'a (set 'b (set) ') (set 'a (set) ')))[^(equal 'a 'b)]}
             {(test (bin 'a) (bin 'b) (set 'a (set 'b @(set) ') '))}
            `
        )
    );
});