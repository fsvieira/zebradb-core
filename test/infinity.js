var should = require("should");
var Z = require("../lib3/z");

describe("Inifinity tests.", function () {
    it("Should declare natural numbers and query all natural numbers", function () {
        var run = new Z(10);
        
        run.add("(nat 0) (nat (nat 'x))");
        
        should(run.print("?(nat 'x)")).eql("@(nat 0)\n@(nat @(nat 0))\n@(nat @(nat @(nat 0)))\n@(nat @(nat @(nat @(nat 0))))");
    });

    it("Should declare natural numbers and query all natural numbers", function () {
        var run = new Z(10);
        
        /*
            A = B
            B = A
        */
        
        run.add("(a (b 'a)) (b (a 'b)) ('x stop)");
        
        should(run.print("?(a 'b)")).eql("@(a @(b @(a @(b stop))))\n@(a @(b @(a stop)))\n@(a @(b stop))\n@(a stop)");
    });

});
