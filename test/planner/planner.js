const testPlanner = require("../../lib/testing/test_planner");

describe('Planner Tests - test for best planner choices.', function () {
    it('should return unique solution.',
        testPlanner(
            `
            (yellow)
            ?('x)`
            ,
            `('x) ** [@(yellow)]`
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
            `(zero 'x) ** [@(zero 0)]`
        )
    );
    
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
            /*
                Why is this the best tuple:
                    1. tail unification with (set) will remove the infinit definition of set,
                    2. variable a and b are related on a negation,
                    3. top most tuple and (set 'b (set) ') don't add any new information,
                    4. (bin 'a), (bin 'b) have possible grow of 4 vs grow of 1,
                        4a. also variables 'a and 'b are related on the choosen tuple with a negation. 
            */
            `(set 'a (set 'b (set) ') ') ** [@(set 'a (set 'b 'tail ') (set 'a 'tail ') ^(equal 'a 'b))]`
        )
    );
});