var should = require("should");
var Z = require("../lib/z");

describe('Get the max solution.', function() {
    it('Declare a number set, get the max number set with all elements.', function() {
        this.timeout(1000 * 60 * 5);
                
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
        
        should(run.print("?(max ')")).eql(
            "@(max @(set @(number 0) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 2))\n!(equal (number 1) (number 2))\n!(set ' (set (number 0) (set @(number 1) (set (number 2) @(set) ') (set (number 1) @(set) ')) @(set (number 0) (set (number 2) @(set) ') (set (number 0) @(set) '))) ')\n!(set ' (set (number 0) @(set (number 1) (set (number 2) @(set) ') (set (number 1) @(set) ')) (set @(number 0) (set (number 2) @(set) ') (set (number 0) @(set) '))) ')]\n" +
            "@(max @(set @(number 0) @(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 2))\n!(equal (number 2) (number 1))\n!(set ' (set (number 0) (set @(number 2) (set (number 1) @(set) ') (set (number 2) @(set) ')) @(set (number 0) (set (number 1) @(set) ') (set (number 0) @(set) '))) ')\n!(set ' (set (number 0) @(set (number 2) (set (number 1) @(set) ') (set (number 2) @(set) ')) (set @(number 0) (set (number 1) @(set) ') (set (number 0) @(set) '))) ')]\n" +
            "@(max @(set @(number 1) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) '))))[^!(equal (number 0) (number 2))\n!(equal (number 1) (number 0))\n!(equal (number 1) (number 2))\n!(set ' (set (number 1) (set @(number 0) (set (number 2) @(set) ') (set (number 0) @(set) ')) @(set (number 1) (set (number 2) @(set) ') (set (number 1) @(set) '))) ')\n!(set ' (set (number 1) @(set (number 0) (set (number 2) @(set) ') (set (number 0) @(set) ')) (set @(number 1) (set (number 2) @(set) ') (set (number 1) @(set) '))) ')]\n" +
            "@(max @(set @(number 1) @(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) '))))[^!(equal (number 1) (number 0))\n!(equal (number 1) (number 2))\n!(equal (number 2) (number 0))\n!(set ' (set (number 1) (set @(number 2) (set (number 0) @(set) ') (set (number 2) @(set) ')) @(set (number 1) (set (number 0) @(set) ') (set (number 1) @(set) '))) ')\n!(set ' (set (number 1) @(set (number 2) (set (number 0) @(set) ') (set (number 2) @(set) ')) (set @(number 1) (set (number 0) @(set) ') (set (number 1) @(set) '))) ')]\n" +
            "@(max @(set @(number 2) @(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 1))\n!(set ' (set (number 2) (set @(number 0) (set (number 1) @(set) ') (set (number 0) @(set) ')) @(set (number 2) (set (number 1) @(set) ') (set (number 2) @(set) '))) ')\n!(set ' (set (number 2) @(set (number 0) (set (number 1) @(set) ') (set (number 0) @(set) ')) (set @(number 2) (set (number 1) @(set) ') (set (number 2) @(set) '))) ')]\n" +
            "@(max @(set @(number 2) @(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) '))))[^!(equal (number 1) (number 0))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 1))\n!(set ' (set (number 2) (set @(number 1) (set (number 0) @(set) ') (set (number 1) @(set) ')) @(set (number 2) (set (number 0) @(set) ') (set (number 2) @(set) '))) ')\n!(set ' (set (number 2) @(set (number 1) (set (number 0) @(set) ') (set (number 1) @(set) ')) (set @(number 2) (set (number 0) @(set) ') (set (number 2) @(set) '))) ')]"
        );
    });
});

