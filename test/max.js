var should = require("should");
var Z = require("../lib/z");

describe('Get the max solution.', function() {
    it('Declare a number set, get the max number set with all elements.', function() {
        var run = new Z();
        
        run.add(
            "(number 0)" +
            "(number 1)" +
            "(number 2)" +
            
            "(equal 'x 'x)" +

            "(set)" +
            "(set (number 'a) (set) ')" +
            "(set (number 'a) (set (number 'b) 'tail ') (set (number 'a) 'tail ') ^(equal (number 'a) (number 'b)))" +
            
            "(max (set 'i 'tail 'p) ^(set ' (set 'i 'tail 'p) '))"
        );
        
        should(run.print("?(max ')")).eql("");
    });
});

