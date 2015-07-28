var should = require("should");
var Z = require("../lib/z");
var utils = require("../lib/utils");

describe('ZQuery Tests.', function() {
    describe('Not Tests', function() {
        it('Should test the Not Constants', function () {
            var query = Z.run(
                "(color yellow)" +
                "(color blue)" +
                "(color red)" +
                "(color white)" +
                "(notYellow (color ^yellow))"
            );

            // Query the facts,
            should(utils.tableFieldsToString(
                query("(color ')")
            )).eql({
                query: "?(color 'x$0)",
                result: [
                    { bound: [ 'x$0' ], vars: { x$0: 'yellow' } },
                    { bound: [ 'x$0' ], vars: { x$0: 'blue' } },
                    { bound: [ 'x$0' ], vars: { x$0: 'red' } },
                    { bound: [ 'x$0' ], vars: { x$0: 'white' } }
                ]
            });
            
            
            should(utils.tableFieldsToString(
                query("(notYellow ')")
            )).eql({
                query: '?(notYellow \'x$0)',
                result: [
                    {
                        bound: [ 'x$0', 'x$1' ],
                        vars: { x$0: '(color \'x$1)', x$1: 'blue' }
                    },
                    {
                        bound: [ 'x$0', 'x$1' ],
                        vars: { x$0: '(color \'x$1)', x$1: 'red' }
                    },
                    {
                        bound: [ 'x$0', 'x$1' ],
                        vars: { x$0: '(color \'x$1)', x$1: 'white' }
                    }
                ]
            });
        });

        it('Should declare a Not-Equal', function () {
            var query = Z.run(
                "(equal 'p 'p)" +
                "(notEqual 'p ^'p)"
            );

            // Query the facts,
            should(utils.tableFieldsToString(
                query("(equal yellow yellow)")
            )).eql({
                query: '?(equal yellow yellow)',
                result: [ { bound: [ 'p' ], vars: { p: 'yellow' } } ]
            });
            
            should(utils.tableFieldsToString(
                query("(equal yellow blue)")
            )).eql({ query: '?(equal yellow blue)' });

            should(utils.tableFieldsToString(
                query("(notEqual yellow yellow)")
            )).eql({ query: '?(notEqual yellow yellow)' });

            should(utils.tableFieldsToString(
                query("(notEqual yellow blue)")
            )).eql({
                query: '?(notEqual yellow blue)',
                result: [
                    { bound: [ 'p', 'x$0' ], vars: { p: 'yellow', x$0: 'blue' } }
                ]
            });
        });

        it('Should make distinct tuples', function () {
            var query = Z.run(
                "(color yellow)" +
                "(color blue)" +
                "(color red)" +
                "(distinct 'item ^'item)"
            );

            // Query the facts,
            should(utils.tableFieldsToString(
                query("(distinct (color yellow) (color yellow))")
            )).eql({ query: '?(distinct (color yellow) (color yellow))' });

            should(utils.tableFieldsToString(
                query("(distinct (color blue) (color yellow))")
            )).eql({
                query: '?(distinct (color blue) (color yellow))',
                result: [
                    {
                        bound: [ 'item', 'x$0' ],
                        vars: { item: '(color blue)', x$0: '(color yellow)' }
                    }
                ]
            });

            should(utils.tableFieldsToString(
                query("(distinct (color 'a) (color 'b))")
            )).eql({});

            
            // should(run.queryArray("(distinct (color 'a) (color 'b))")).eql([
            //    "(distinct (color 'a = blue) (color 'b = yellow))",
            //    "(distinct (color 'a = red) (color 'b = yellow))",
            //    "(distinct (color 'a = yellow) (color 'b = blue))",
            //    "(distinct (color 'a = red) (color 'b = blue))",
            //    "(distinct (color 'a = yellow) (color 'b = red))",
            //    "(distinct (color 'a = blue) (color 'b = red))"
            // ]);
        });

        it('Should declare a Set (inv)', function () {
            var run;
            run = new ZQuery.Run(
                "(number 0)" +
                "(number 1)" +
                "(set)" +
                "(set 'item (set) ')" +
                "(set ^'item (set 'item 'tail ') (set ^'item 'tail '))"
            );
            
            should(run.queryArray("(set (number 'a) (set (number 'b) (set) ') ')")).eql([
                "(set (number 'a = 1) (set (number 'b = 0) (set) ') ' = (set ' 'tail = (set) '))",
                "(set (number 'a = 0) (set (number 'b = 1) (set) ') ' = (set ' 'tail = (set) '))"
            ]);
        });

        it('Should declare simple not.', function () {
            var run;
            run = new ZQuery.Run(
                "(number 0)" +
                "(number 1)" +
                "(not 'a ^'a)"
            );
            
            should(run.queryArray("(not (number 'p) (number 'q))")).eql([
                "(not (number 'p = 1) (number 'q = 0))",
                "(not (number 'p = 0) (number 'q = 1))"
            ]);
        });
        
        it('Should declare a Set', function () {
            var run;
            run = new ZQuery.Run(
                "(number 0)" +
                "(number 1)" +
                "(set)" +
                "(set 'item (set) ')" +
                "(set 'item (set ^'item 'tail ') (set 'item 'tail '))"
            );
            
            should(run.queryArray("(set (number 'a) (set (number 'b) (set) ') ')")).eql([
                "(set (number 'a = 0) (set (number 'b = 1) (set) ') ' = (set 'item = (number 'a = 0) 'tail = (set) '))",
                "(set (number 'a = 1) (set (number 'b = 0) (set) ') ' = (set 'item = (number 'a = 1) 'tail = (set) '))"
            ]);
        });
    });
});