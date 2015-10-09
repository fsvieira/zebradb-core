var should = require("should");
var Z = require("../lib/unify");

describe('ZQuery Tests.', function() {
    describe('Not Tests', function() {
        it('Should test the Not Constants', function () {
            var zquery = Z.run(
                "(color yellow)" +
                "(color blue)" +
                "(color red)" +
                "(color white)" +
                "(notYellow (color ^yellow))"
            );

            var query = function (q) {
                return Z.toString(zquery(q));
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
            var zquery = Z.run(
                "(equal 'p 'p)" +
                "(notEqual 'p ^'p)"
            );
            
            var query = function (q) {
                return Z.toString(zquery(q));
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
            var zquery = Z.run(
                "(color yellow)" +
                "(color blue)" +
                "(color red)" +
                "(distinct 'item ^'item)"
            );

            var query = function (q) {
                return Z.toString(zquery(q));
            };
            
            // Query the facts,
            should(
                query("(distinct (color yellow) (color yellow))")
            ).eql({ query: '?(distinct (color yellow) (color yellow))' });

            should(
                query("(distinct (color blue) (color yellow))")
            ).eql({
                query: '?(distinct (color blue) (color yellow))',
                result: [
                    {
                        bound: [ 'item', 'x$0' ],
                        vars: { item: '(color blue)', x$0: '(color yellow)' }
                    }
                ]
            });

            should(
                query("(distinct (color 'a) (color 'b))")
            ).eql({
                query: '?(distinct (color \'a) (color \'b))',
                result: [
                    {
                        bound: [ 'a', 'b', 'item', 'x$0' ],
                        vars: { a: 'yellow', b: 'blue', item: '(color \'a)', x$0: '(color \'b)' }
                    },
                    {
                        bound: [ 'a', 'b', 'item', 'x$0' ],
                        vars: { a: 'yellow', b: 'red', item: '(color \'a)', x$0: '(color \'b)' }
                    },
                    {
                        bound: [ 'a', 'b', 'item', 'x$0' ],
                        vars: { a: 'blue', b: 'yellow', item: '(color \'a)', x$0: '(color \'b)' }
                    },
                    {
                        bound: [ 'a', 'b', 'item', 'x$0' ],
                        vars: { a: 'blue', b: 'red', item: '(color \'a)', x$0: '(color \'b)' }
                    },
                    {
                        bound: [ 'a', 'b', 'item', 'x$0' ],
                        vars: { a: 'red', b: 'yellow', item: '(color \'a)', x$0: '(color \'b)' }
                    },
                    {
                        bound: [ 'a', 'b', 'item', 'x$0' ],
                        vars: { a: 'red', b: 'blue', item: '(color \'a)', x$0: '(color \'b)' }
                    }
                ]
            });
        });

        it('Should declare simple not.', function () {
            var query = Z.run(
                "(number 0)" +
                "(number 1)" +
                "(not 'a ^'a)"
            );
            
            should(
                query("(not (number 'p) (number 'q))")
            ).eql({
                query: '?(not (number \'p) (number \'q))',
                result: [
                    {
                        bound: [ 'a', 'p', 'q', 'x$0' ],
                        vars: { a: '(number \'p)', p: '0', q: '1', x$0: '(number \'q)' }
                    },
                    {
                        bound: [ 'a', 'p', 'q', 'x$0' ],
                        vars: { a: '(number \'p)', p: '1', q: '0', x$0: '(number \'q)' }
                    }
                ]
            });
        });

        it('Should declare a Set', function () {
            var query = Z.run(
                "(number 0)" +
                "(number 1)" +
                "(set)" +
                "(set 'item (set) ')" +
                "(set 'item (set ^'item 'tail ') (set 'item 'tail '))"
            );

            should(
                query("(set (number 'a) (set (number 'b) (set) ') ')")
            ).eql({
              query: '?(set (number \'a) (set (number \'b) (set) \'x$0) \'x$1)',
              result: [
                {
                  bound: [
                    'a',
                    'b',
                    'item',
                    'tail',
                    'x$0',
                    'x$1',
                    'x$2',
                    'x$3',
                    'x$4',
                    'x$5',
                    'x$6',
                    'x$7',
                    'x$8'
                  ],
                  vars: {
                    a: '0',
                    b: '1',
                    item: '(number \'a)',
                    tail: '(set)',
                    x$0: '\'x$4',
                    x$1: '(set \'item \'tail \'x$2)',
                    x$2: '',
                    x$3: '(number \'b)',
                    x$4: '',
                    x$5: '(number \'b)',
                    x$6: '\'x$4',
                    x$7: '\'x$2',
                    x$8: '\'item'
                  }
                },
                {
                  bound: [
                    'a',
                    'b',
                    'item',
                    'tail',
                    'x$0',
                    'x$1',
                    'x$2',
                    'x$3',
                    'x$4',
                    'x$5',
                    'x$6',
                    'x$7',
                    'x$8'
                  ],
                  vars: {
                    a: '1',
                    b: '0',
                    item: '(number \'a)',
                    tail: '(set)',
                    x$0: '\'x$4',
                    x$1: '(set \'item \'tail \'x$2)',
                    x$2: '',
                    x$3: '(number \'b)',
                    x$4: '',
                    x$5: '(number \'b)',
                    x$6: '\'x$4',
                    x$7: '\'x$2',
                    x$8: '\'item'
                  }
                }
              ]
            });
            
            should(
                query("(set (number 'a) (set (number 'b) (set (number 'c) (set) ') ') ')")
            ).eql({
                query: '?(set (number \'a) (set (number \'b) (set (number \'c) (set) \'x$0) \'x$1) \'x$2)'
            });
        });

        it('Should declare a number Set', function () {
            var query = Z.run(
                "(number 0)" +
                "(number 1)" +
                "(set)" +
                "(set (number 'a) (set) ')" +
                "(set (number 'a) (set (number ^'a) 'tail ') (set (number 'a) 'tail '))"
            );

            should(
                query("(set (number 'a) 'tail ')", 3)
            ).eql({
              query: '?(set (number \'a) \'tail \'x$0)',
              result: [
                {
                  bound: [ 'a', 'tail', 'x$0', 'x$1', 'x$2' ],
                  vars: { a: '0', tail: '(set)', x$0: '\'x$2', x$1: '\'a', x$2: '' }
                },
                {
                  bound: [ 'a', 'tail', 'x$0', 'x$1', 'x$2' ],
                  vars: { a: '1', tail: '(set)', x$0: '\'x$2', x$1: '\'a', x$2: '' }
                },
                {
                  bound: [ 'a', 'tail', 'x$0', 'x$1', 'x$2', 'x$3', 'x$4', 'x$5', 'x$6', 'x$7', 'x$8', 'x$9' ],
                  vars: {
                    a: '0',
                    tail: '(set (number \'x$5:[^\'a]) \'x$4 \'x$1)',
                    x$0: '(set (number \'x$3) \'x$4 \'x$2)',
                    x$1: '\'x$6',
                    x$2: '\'x$9',
                    x$3: '\'a',
                    x$4: '(set)',
                    x$5: '1',
                    x$6: '',
                    x$7: '\'x$5:[^\'a]',
                    x$8: '\'a',
                    x$9: ''
                  }
                },
                {
                  bound: [ 'a', 'tail', 'x$0', 'x$1', 'x$2', 'x$3', 'x$4', 'x$5', 'x$6', 'x$7', 'x$8', 'x$9' ],
                  vars: {
                    a: '1',
                    tail: '(set (number \'x$5:[^\'a]) \'x$4 \'x$1)',
                    x$0: '(set (number \'x$3) \'x$4 \'x$2)',
                    x$1: '\'x$6',
                    x$2: '\'x$9',
                    x$3: '\'a',
                    x$4: '(set)',
                    x$5: '0',
                    x$6: '',
                    x$7: '\'x$5:[^\'a]',
                    x$8: '\'a',
                    x$9: ''
                  }
                }
              ]
            });
        });
    });
});