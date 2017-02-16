var should = require("should");
var Z = require("../lib3/z");

describe("Inifinity tests.", function () {
    it("Should declare natural numbers and query all natural numbers", function () {
        var run = new Z();
        
        run.add("(nat 0) (nat (nat 'x))");
        
        // Should never stop with current config.
        should(run.print("?(nat 'x)")).eql("");
    });
});
