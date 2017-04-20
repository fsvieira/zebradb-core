var should = require("should");
var Z = require("../lib/z");

describe("Include tests.", function () {
    it("Should include list", function () {
        var run = new Z(10);
        
        run.add("[list] [list]");
        
        should(run.print("?(list)")).eql("@(list)");
    });
});
