var should = require("should");
var Z = require("../lib/unify");

describe('ZQuery Tests.', function() {
    describe('Not Tests', function() {
        it('Should test the Not Constants', function () {
            var run = new Z.Run(
                "(color yellow)" +
                "(color blue)" +
                "(color red)" +
                "(color white)" +
                "(notYellow (color ^yellow))"
            );

            var query = function (q) {
                return Z.toString(run.query(q));
            };
            
            // Query the facts,
            should(
                query("(color ')")
            ).eql(
                "(color yellow)\n" +
                "(color blue)\n" + 
                "(color red)\n" +
                "(color white)"
            );

            should(
                query("(notYellow ')")
            ).eql(
                '(notYellow (color blue))\n' + 
                '(notYellow (color red))\n' +
                '(notYellow (color white))'
            );
        });

        it('Should declare a Not-Equal', function () {
            var run = new Z.Run(
                "(equal 'p 'p)" +
                "(notEqual 'p ^'p)"
            );
            
            var query = function (q) {
                return Z.toString(run.query(q));
            };

            // Query the facts,
            should(
                query("(equal yellow yellow)")
            ).eql("(equal yellow yellow)");

            should(
                query("(equal yellow blue)")
            ).eql("");

            should(
                query("(notEqual yellow yellow)")
            ).eql("");

            should(
                query("(notEqual yellow blue)")
            ).eql("(notEqual yellow blue)");
        });

        it('Should make distinct tuples', function () {
            var run = new Z.Run(
                "(color yellow)" +
                "(color blue)" +
                "(color red)" +
                "(distinct 'item ^'item)"
            );

            var query = function (q) {
                return Z.toString(run.query(q));
            };
            
            // Query the facts,
            should(
                query("(distinct (color yellow) (color yellow))")
            ).eql('');

            should(
                query("(distinct (color blue) (color yellow))")
            ).eql("(distinct (color blue) (color yellow))");

            should(
                query("(distinct (color 'a) (color 'b))")
            ).eql(
                '(distinct (color yellow) (color blue))\n' + 
                '(distinct (color yellow) (color red))\n' + 
                '(distinct (color blue) (color yellow))\n' + 
                '(distinct (color blue) (color red))\n' + 
                '(distinct (color red) (color yellow))\n' + 
                '(distinct (color red) (color blue))'
            );
        });

        it('Should declare simple not.', function () {
            var run = new Z.Run(
                "(number 0)" +
                "(number 1)" +
                "(not 'a ^'a)"
            );
            
            var query = function (q) {
                return Z.toString(run.query(q));
            };
            
            should(
                query("(not (number 'p) (number 'q))")
            ).eql(
                "(not (number 0) (number 1))\n" +
                "(not (number 1) (number 0))"
            );
        });

        it('Should declare a Set', function () {
            var run = new Z.Run(
                "(number 0)" +
                "(number 1)" +
                "(set)" +
                "(set 'item (set) ')" +
                "(set 'item (set ^'item 'tail ') (set 'item 'tail '))"
            );

            var query = function (q) {
                return Z.toString(run.query(q));
            };

            should(
                query("(set (number 'a) (set (number 'b) (set) ') ')")
            ).eql(
                "(set (number 0) (set (number 1) (set) \'x$0) (set (number 0) (set) \'x$1))\n" +
                "(set (number 1) (set (number 0) (set) \'x$0) (set (number 1) (set) \'x$1))"
            );

            should(
                query("(set (number 'a) (set (number 'b) (set (number 'c) (set) ') ') ')")
            ).eql('');
        });

        it('Should declare a number Set', function () {
            var run = new Z.Run(
                "(number 0)" +
                "(number 1)" +
                "(set)" +
                "(set (number 'a) (set) ')" +
                "(set (number 'a) (set (number ^'a) 'tail ') (set (number 'a) 'tail '))"
            );

            var query = function (q) {
                return Z.toString(run.query(q));
            };
            
            should(
                query("(set (number 'a) 'tail ')")
            ).eql(
                "(set (number 0) (set) \'x$2)\n" +
                "(set (number 1) (set) \'x$2)\n" +
                "(set (number 0) (set (number 1) (set) \'x$0) (set (number 0) (set) \'x$3))\n" + 
                "(set (number 1) (set (number 0) (set) \'x$0) (set (number 1) (set) \'x$3))"
            );
        });
    });
});


