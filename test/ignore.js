var should = require("should");
var Z = require("../lib/z");
var ZQuery = require("../lib/zquery");
var D = require("../lib/zquery_debug");

describe('Ignore Tests', function() {
    describe('If ... then ... else', function() {
        it('should declare simple if then else.', function () {
            var run; 
            
            run = new ZQuery.Run(
                "(bool true)" +
                "(bool false)" +
                "(if (bool true) 'p _ 'p)" +
                "(if (bool false) _ 'p 'p)"
            );

            should(run.queryArray(
                "(if (bool true) (bool true) (bool false) 'r)"
            )).eql(["(if (bool true) (bool true) (bool false) 'r = (bool true))"]);
            
            should(run.queryArray(
                "(if (bool false) (bool true) (bool false) 'r)"
            )).eql(["(if (bool false) (bool true) (bool false) 'r = (bool false))"]);
            
            
        });
    });
});