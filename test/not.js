var should = require("should");
var Z = require("../lib3/z");

describe('Not Tests.', function() {
    it('Declare a not equal', function() {
        var run = new Z();

        run.add("(equal 'x 'x) (not-equal 'x 'y ^(equal 'x 'y))");
        should(run.print("?(equal yellow yellow)")).eql("@(equal yellow yellow)");
        should(run.print("?(equal yellow blue)")).eql("");

        should(run.print("?(not-equal yellow yellow)")).eql("");
        should(run.print("?(not-equal yellow blue)")).eql("@(not-equal yellow blue)");

    });

    it('Should make distinct tuples', function() {
        var run = new Z();
        
        run.add(
            "(color yellow)" +
            "(color blue)" +
            "(color red)" +
            "(equal 'x 'x)" +
            "(distinct 'x 'y ^(equal 'x 'y))"
        );
        
        should(run.print("?(distinct (color yellow) (color yellow))")).eql("");

        should(run.print("?(distinct (color yellow) (color blue))")).eql(
            "@(distinct @(color yellow) @(color blue))"
        );
        
        should(run.print("?(distinct (color 'a) (color 'b))")).eql(
            "@(distinct @(color blue) @(color yellow))\n" +
            "@(distinct @(color red) @(color yellow))\n" +
            "@(distinct @(color yellow) @(color blue))\n" +
            "@(distinct @(color red) @(color blue))\n" +
            "@(distinct @(color yellow) @(color red))\n" +
            "@(distinct @(color blue) @(color red))"
        );
    });

    it('Should declare simple not.', function() {
        var run = new Z();
        
        run.add(
            "(number 0)" +
            "(number 1)" +
            "(not 'x 'y ^(equal 'x 'y))" +
            "(equal 'x 'x)"
        );
        
        should(run.print("?(not (number 'p) (number 'q))")).eql(
            "@(not @(number 1) @(number 0))\n" + 
            "@(not @(number 0) @(number 1))"
        );
    });

    it('Should declare a two number Set', function() {
        var run = new Z();
        
        run.add(
            "(number 0)" +
            "(number 1)" +
            "(set)" +
            "(set 'item (set) ')" +
            "(set 'itemA (set 'itemB 'tail ') (set 'itemA 'tail ') ^(equal 'itemA 'itemB))" +
            "(equal 'x 'x)"
        );
        
        should(run.print("?(set (number 'a) (set (number 'b) (set) ') ')")).eql(
            "@(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) '))\n" +
            "@(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) '))"
        );
        
        should(run.print("?(set (number 'a) (set (number 'b) (set (number 'c) (set) ') ') ')")).eql("");
    });

    it('Should declare a two number Set, query all', function() {
        var run = new Z();
        
        run.add(
            "(number 0)" +
            "(number 1)" +
            "(set)" +
            "(set 'item (set) ')" +
            "(set 'itemA (set 'itemB 'tail ') (set 'itemA 'tail ') ^(equal 'itemA 'itemB))" +
            "(equal 'x 'x)"
        );
        try {
            should(run.print("?(set (number 'a) 'tail ')")).eql(
                "@(set @(number 0) @(set) ')\n" + 
                "@(set @(number 1) @(set) ')\n" +
                "@(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) '))\n" +
                "@(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) '))"
            );
        } catch (e) {
          console.log(JSON.stringify(run.zvs.objects, null, '\t'));  
        }
    });

    it('Should declare a number Set, 3 elements', function() {
        var run = new Z.Run(
            "(number 0)" +
            "(number 1)" +
            "(number 2)" +
            "(set)" +
            "(set (number 'a) (set) ')" +
            "(set (number 'a) (set (number ^'a) 'tail ') (set (number 'a) 'tail '))"
        );

        var query = function(q) {
            return Z.toString(run.query(q));
        };

        should(
            query("(set (number 0) (set (number 1) (set (number 2) (set) ') ') ')")
        ).eql(
            "(set (number 0) (set (number 1) (set (number 2) (set) 'x$0) (set (number 1) (set) 'x$1)) (set (number 0) (set (number 2) (set) 'x$0) (set (number 0) (set) 'x$2)))"
        );

        should(
            query("(set (number 'a) 'tail ')")
        ).eql(
            "(set (number 0) (set (number 1) (set (number 2) (set) 'x$0) (set (number 1) (set) 'x$1)) (set (number 0) (set (number 2) (set) 'x$0) (set (number 0) (set) 'x$2)))\n" +
            "(set (number 0) (set (number 1) (set) 'x$0) (set (number 0) (set) 'x$1))\n" +
            "(set (number 0) (set (number 2) (set (number 1) (set) 'x$0) (set (number 2) (set) 'x$1)) (set (number 0) (set (number 1) (set) 'x$0) (set (number 0) (set) 'x$2)))\n" +
            "(set (number 0) (set (number 2) (set) 'x$0) (set (number 0) (set) 'x$1))\n" +
            "(set (number 0) (set) 'x$0)\n" +
            "(set (number 1) (set (number 0) (set (number 2) (set) 'x$0) (set (number 0) (set) 'x$1)) (set (number 1) (set (number 2) (set) 'x$0) (set (number 1) (set) 'x$2)))\n" +
            "(set (number 1) (set (number 0) (set) 'x$0) (set (number 1) (set) 'x$1))\n" +
            "(set (number 1) (set (number 2) (set (number 0) (set) 'x$0) (set (number 2) (set) 'x$1)) (set (number 1) (set (number 0) (set) 'x$0) (set (number 1) (set) 'x$2)))\n" +
            "(set (number 1) (set (number 2) (set) 'x$0) (set (number 1) (set) 'x$1))\n" +
            "(set (number 1) (set) 'x$0)\n" +
            "(set (number 2) (set (number 0) (set (number 1) (set) 'x$0) (set (number 0) (set) 'x$1)) (set (number 2) (set (number 1) (set) 'x$0) (set (number 2) (set) 'x$2)))\n" +
            "(set (number 2) (set (number 0) (set) 'x$0) (set (number 2) (set) 'x$1))\n" +
            "(set (number 2) (set (number 1) (set (number 0) (set) 'x$0) (set (number 1) (set) 'x$1)) (set (number 2) (set (number 0) (set) 'x$0) (set (number 2) (set) 'x$2)))\n" +
            "(set (number 2) (set (number 1) (set) 'x$0) (set (number 2) (set) 'x$1))\n" +
            "(set (number 2) (set) 'x$0)"
        );
    });

    it('Should declare a number Set, 4 elements', function() {
        this.timeout(1000 * 60 * 5);

        var run = new Z.Run(
            "(number 0)" +
            "(number 1)" +
            "(number 2)" +
            "(number 3)" +
            "(set)" +
            "(set (number 'a) (set) ')" +
            "(set (number 'a) (set (number ^'a) 'tail ') (set (number 'a) 'tail '))"
        );

        var query = function(q) {
            return Z.toString(run.query(q));
        };

        should(
            query("(set (number 0) (set (number 1) (set (number 2) (set (number 3) (set) ') ') ') ')")
        ).eql(
            "(set (number 0) (set (number 1) (set (number 2) (set (number 3) (set) 'x$0) (set (number 2) (set) 'x$1)) (set (number 1) (set (number 3) (set) 'x$0) (set (number 1) (set) 'x$2))) (set (number 0) (set (number 2) (set (number 3) (set) 'x$0) (set (number 2) (set) 'x$1)) (set (number 0) (set (number 3) (set) 'x$0) (set (number 0) (set) 'x$3))))"
        );

        should(
            query("(set (number 'a) (set (number 'b) (set (number 'c) (set (number 'd) (set) ') ') ') ')")
        ).eql(
            "(set (number 0) (set (number 1) (set (number 2) (set (number 3) (set) 'x$0) (set (number 2) (set) 'x$1)) (set (number 1) (set (number 3) (set) 'x$0) (set (number 1) (set) 'x$2))) (set (number 0) (set (number 2) (set (number 3) (set) 'x$0) (set (number 2) (set) 'x$1)) (set (number 0) (set (number 3) (set) 'x$0) (set (number 0) (set) 'x$3))))\n" +
            "(set (number 0) (set (number 1) (set (number 3) (set (number 2) (set) 'x$0) (set (number 3) (set) 'x$1)) (set (number 1) (set (number 2) (set) 'x$0) (set (number 1) (set) 'x$2))) (set (number 0) (set (number 3) (set (number 2) (set) 'x$0) (set (number 3) (set) 'x$1)) (set (number 0) (set (number 2) (set) 'x$0) (set (number 0) (set) 'x$3))))\n" +
            "(set (number 0) (set (number 2) (set (number 1) (set (number 3) (set) 'x$0) (set (number 1) (set) 'x$1)) (set (number 2) (set (number 3) (set) 'x$0) (set (number 2) (set) 'x$2))) (set (number 0) (set (number 1) (set (number 3) (set) 'x$0) (set (number 1) (set) 'x$1)) (set (number 0) (set (number 3) (set) 'x$0) (set (number 0) (set) 'x$3))))\n" +
            "(set (number 0) (set (number 2) (set (number 3) (set (number 1) (set) 'x$0) (set (number 3) (set) 'x$1)) (set (number 2) (set (number 1) (set) 'x$0) (set (number 2) (set) 'x$2))) (set (number 0) (set (number 3) (set (number 1) (set) 'x$0) (set (number 3) (set) 'x$1)) (set (number 0) (set (number 1) (set) 'x$0) (set (number 0) (set) 'x$3))))\n" +
            "(set (number 0) (set (number 3) (set (number 1) (set (number 2) (set) 'x$0) (set (number 1) (set) 'x$1)) (set (number 3) (set (number 2) (set) 'x$0) (set (number 3) (set) 'x$2))) (set (number 0) (set (number 1) (set (number 2) (set) 'x$0) (set (number 1) (set) 'x$1)) (set (number 0) (set (number 2) (set) 'x$0) (set (number 0) (set) 'x$3))))\n" +
            "(set (number 0) (set (number 3) (set (number 2) (set (number 1) (set) 'x$0) (set (number 2) (set) 'x$1)) (set (number 3) (set (number 1) (set) 'x$0) (set (number 3) (set) 'x$2))) (set (number 0) (set (number 2) (set (number 1) (set) 'x$0) (set (number 2) (set) 'x$1)) (set (number 0) (set (number 1) (set) 'x$0) (set (number 0) (set) 'x$3))))\n" +
            "(set (number 1) (set (number 0) (set (number 2) (set (number 3) (set) 'x$0) (set (number 2) (set) 'x$1)) (set (number 0) (set (number 3) (set) 'x$0) (set (number 0) (set) 'x$2))) (set (number 1) (set (number 2) (set (number 3) (set) 'x$0) (set (number 2) (set) 'x$1)) (set (number 1) (set (number 3) (set) 'x$0) (set (number 1) (set) 'x$3))))\n" +
            "(set (number 1) (set (number 0) (set (number 3) (set (number 2) (set) 'x$0) (set (number 3) (set) 'x$1)) (set (number 0) (set (number 2) (set) 'x$0) (set (number 0) (set) 'x$2))) (set (number 1) (set (number 3) (set (number 2) (set) 'x$0) (set (number 3) (set) 'x$1)) (set (number 1) (set (number 2) (set) 'x$0) (set (number 1) (set) 'x$3))))\n" +
            "(set (number 1) (set (number 2) (set (number 0) (set (number 3) (set) 'x$0) (set (number 0) (set) 'x$1)) (set (number 2) (set (number 3) (set) 'x$0) (set (number 2) (set) 'x$2))) (set (number 1) (set (number 0) (set (number 3) (set) 'x$0) (set (number 0) (set) 'x$1)) (set (number 1) (set (number 3) (set) 'x$0) (set (number 1) (set) 'x$3))))\n" +
            "(set (number 1) (set (number 2) (set (number 3) (set (number 0) (set) 'x$0) (set (number 3) (set) 'x$1)) (set (number 2) (set (number 0) (set) 'x$0) (set (number 2) (set) 'x$2))) (set (number 1) (set (number 3) (set (number 0) (set) 'x$0) (set (number 3) (set) 'x$1)) (set (number 1) (set (number 0) (set) 'x$0) (set (number 1) (set) 'x$3))))\n" +
            "(set (number 1) (set (number 3) (set (number 0) (set (number 2) (set) 'x$0) (set (number 0) (set) 'x$1)) (set (number 3) (set (number 2) (set) 'x$0) (set (number 3) (set) 'x$2))) (set (number 1) (set (number 0) (set (number 2) (set) 'x$0) (set (number 0) (set) 'x$1)) (set (number 1) (set (number 2) (set) 'x$0) (set (number 1) (set) 'x$3))))\n" +
            "(set (number 1) (set (number 3) (set (number 2) (set (number 0) (set) 'x$0) (set (number 2) (set) 'x$1)) (set (number 3) (set (number 0) (set) 'x$0) (set (number 3) (set) 'x$2))) (set (number 1) (set (number 2) (set (number 0) (set) 'x$0) (set (number 2) (set) 'x$1)) (set (number 1) (set (number 0) (set) 'x$0) (set (number 1) (set) 'x$3))))\n" +
            "(set (number 2) (set (number 0) (set (number 1) (set (number 3) (set) 'x$0) (set (number 1) (set) 'x$1)) (set (number 0) (set (number 3) (set) 'x$0) (set (number 0) (set) 'x$2))) (set (number 2) (set (number 1) (set (number 3) (set) 'x$0) (set (number 1) (set) 'x$1)) (set (number 2) (set (number 3) (set) 'x$0) (set (number 2) (set) 'x$3))))\n" +
            "(set (number 2) (set (number 0) (set (number 3) (set (number 1) (set) 'x$0) (set (number 3) (set) 'x$1)) (set (number 0) (set (number 1) (set) 'x$0) (set (number 0) (set) 'x$2))) (set (number 2) (set (number 3) (set (number 1) (set) 'x$0) (set (number 3) (set) 'x$1)) (set (number 2) (set (number 1) (set) 'x$0) (set (number 2) (set) 'x$3))))\n" +
            "(set (number 2) (set (number 1) (set (number 0) (set (number 3) (set) 'x$0) (set (number 0) (set) 'x$1)) (set (number 1) (set (number 3) (set) 'x$0) (set (number 1) (set) 'x$2))) (set (number 2) (set (number 0) (set (number 3) (set) 'x$0) (set (number 0) (set) 'x$1)) (set (number 2) (set (number 3) (set) 'x$0) (set (number 2) (set) 'x$3))))\n" +
            "(set (number 2) (set (number 1) (set (number 3) (set (number 0) (set) 'x$0) (set (number 3) (set) 'x$1)) (set (number 1) (set (number 0) (set) 'x$0) (set (number 1) (set) 'x$2))) (set (number 2) (set (number 3) (set (number 0) (set) 'x$0) (set (number 3) (set) 'x$1)) (set (number 2) (set (number 0) (set) 'x$0) (set (number 2) (set) 'x$3))))\n" +
            "(set (number 2) (set (number 3) (set (number 0) (set (number 1) (set) 'x$0) (set (number 0) (set) 'x$1)) (set (number 3) (set (number 1) (set) 'x$0) (set (number 3) (set) 'x$2))) (set (number 2) (set (number 0) (set (number 1) (set) 'x$0) (set (number 0) (set) 'x$1)) (set (number 2) (set (number 1) (set) 'x$0) (set (number 2) (set) 'x$3))))\n" +
            "(set (number 2) (set (number 3) (set (number 1) (set (number 0) (set) 'x$0) (set (number 1) (set) 'x$1)) (set (number 3) (set (number 0) (set) 'x$0) (set (number 3) (set) 'x$2))) (set (number 2) (set (number 1) (set (number 0) (set) 'x$0) (set (number 1) (set) 'x$1)) (set (number 2) (set (number 0) (set) 'x$0) (set (number 2) (set) 'x$3))))\n" +
            "(set (number 3) (set (number 0) (set (number 1) (set (number 2) (set) 'x$0) (set (number 1) (set) 'x$1)) (set (number 0) (set (number 2) (set) 'x$0) (set (number 0) (set) 'x$2))) (set (number 3) (set (number 1) (set (number 2) (set) 'x$0) (set (number 1) (set) 'x$1)) (set (number 3) (set (number 2) (set) 'x$0) (set (number 3) (set) 'x$3))))\n" +
            "(set (number 3) (set (number 0) (set (number 2) (set (number 1) (set) 'x$0) (set (number 2) (set) 'x$1)) (set (number 0) (set (number 1) (set) 'x$0) (set (number 0) (set) 'x$2))) (set (number 3) (set (number 2) (set (number 1) (set) 'x$0) (set (number 2) (set) 'x$1)) (set (number 3) (set (number 1) (set) 'x$0) (set (number 3) (set) 'x$3))))\n" +
            "(set (number 3) (set (number 1) (set (number 0) (set (number 2) (set) 'x$0) (set (number 0) (set) 'x$1)) (set (number 1) (set (number 2) (set) 'x$0) (set (number 1) (set) 'x$2))) (set (number 3) (set (number 0) (set (number 2) (set) 'x$0) (set (number 0) (set) 'x$1)) (set (number 3) (set (number 2) (set) 'x$0) (set (number 3) (set) 'x$3))))\n" +
            "(set (number 3) (set (number 1) (set (number 2) (set (number 0) (set) 'x$0) (set (number 2) (set) 'x$1)) (set (number 1) (set (number 0) (set) 'x$0) (set (number 1) (set) 'x$2))) (set (number 3) (set (number 2) (set (number 0) (set) 'x$0) (set (number 2) (set) 'x$1)) (set (number 3) (set (number 0) (set) 'x$0) (set (number 3) (set) 'x$3))))\n" +
            "(set (number 3) (set (number 2) (set (number 0) (set (number 1) (set) 'x$0) (set (number 0) (set) 'x$1)) (set (number 2) (set (number 1) (set) 'x$0) (set (number 2) (set) 'x$2))) (set (number 3) (set (number 0) (set (number 1) (set) 'x$0) (set (number 0) (set) 'x$1)) (set (number 3) (set (number 1) (set) 'x$0) (set (number 3) (set) 'x$3))))\n" +
            "(set (number 3) (set (number 2) (set (number 1) (set (number 0) (set) 'x$0) (set (number 1) (set) 'x$1)) (set (number 2) (set (number 0) (set) 'x$0) (set (number 2) (set) 'x$2))) (set (number 3) (set (number 1) (set (number 0) (set) 'x$0) (set (number 1) (set) 'x$1)) (set (number 3) (set (number 0) (set) 'x$0) (set (number 3) (set) 'x$3))))"
        );
    });
});
