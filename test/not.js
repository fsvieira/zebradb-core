var should = require("should");
var Z = require("../lib/z");
var utils = require("../lib/utils");

describe('ZQuery Tests.', function() {
    describe('Not Tests', function() {
/*
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
            )).eql({
                query: '?(distinct (color \'a) (color \'b))',
                result: [
                    {
                      bound: [ 'a', 'b', 'item', 'x$0' ],
                      vars: { a: 'blue', b: 'yellow', item: '(color \'a)', x$0: '(color \'b)' }
                    },
                    {
                      bound: [ 'a', 'b', 'item', 'x$0' ],
                      vars: { a: 'red', b: 'yellow', item: '(color \'a)', x$0: '(color \'b)' }
                    },
                    {
                      bound: [ 'a', 'b', 'item', 'x$0' ],
                      vars: { a: 'yellow', b: 'blue', item: '(color \'a)', x$0: '(color \'b)' }
                    },
                    {
                      bound: [ 'a', 'b', 'item', 'x$0' ],
                      vars: { a: 'red', b: 'blue', item: '(color \'a)', x$0: '(color \'b)' }
                    },
                    {
                      bound: [ 'a', 'b', 'item', 'x$0' ],
                      vars: { a: 'yellow', b: 'red', item: '(color \'a)', x$0: '(color \'b)' }
                    },
                    {
                      bound: [ 'a', 'b', 'item', 'x$0' ],
                      vars: { a: 'blue', b: 'red', item: '(color \'a)', x$0: '(color \'b)' }
                    }
                ]
            });
        });

        it('Should declare a Set (inv)', function () {
            var query = Z.run(
                "(number 0)" +
                "(number 1)" +
                "(set)" +
                "(set 'item (set) ')" +
                "(set ^'item (set 'item 'tail ') (set ^'item 'tail '))"
            );
            
            should(utils.tableFieldsToString(
                query("(set (number 'a) (set (number 'b) (set) ') ')")
            )).eql({
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
                            'x$8',
                            'x$9'
                        ],
                        vars: {
                            a: '1',
                            b: '0',
                            item: '(number \'b)',
                            tail: '(set)',
                            x$0: '',
                            x$1: '(set \'x$2 \'tail \'x$3)',
                            x$2: '\'x$8',
                            x$3: '\'x$9',
                            x$4: '(number \'a)',
                            x$5: '\'x$0',
                            x$6: '\'x$0',
                            x$7: '(number \'b)',
                            x$8: '',
                            x$9: ''
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
                            'x$8',
                            'x$9'
                        ],
                        vars: {
                            a: '0',
                            b: '1',
                            item: '(number \'b)',
                            tail: '(set)',
                            x$0: '',
                            x$1: '(set \'x$2 \'tail \'x$3)',
                            x$2: '\'x$8',
                            x$3: '\'x$9',
                            x$4: '(number \'a)',
                            x$5: '\'x$0',
                            x$6: '\'x$0',
                            x$7: '(number \'b)',
                            x$8: '',
                            x$9: ''
                        }
                    }
                ]
            });
        });
*/

        it('Should declare simple not.', function () {
            var query = Z.run(
                "(number 0)" +
                "(number 1)" +
                "(not 'a ^'a)"
            );
            
            should(utils.tableFieldsToString(
                query("(not (number 'p) (number 'q))")
            )).eql({
                query: '?(not (number \'p) (number \'q))',
                result: [
                    {
                        bound: [ 'a', 'p', 'q', 'x$0' ],
                        vars: { a: '(number \'p)', p: '1', q: '0', x$0: '(number \'q)' }
                    },
                    {
                        bound: [ 'a', 'p', 'q', 'x$0' ],
                        vars: { a: '(number \'p)', p: '0', q: '1', x$0: '(number \'q)' }
                    }
                ]
            });
        });
/*
        it('Should declare a Set', function () {
            var query = Z.run(
                "(number 0)" +
                "(number 1)" +
                "(set)" +
                "(set 'item (set) ')" +
                "(set 'item (set ^'item 'tail ') (set 'item 'tail '))"
            );

            should(utils.tableFieldsToString(
                query("(set (number 'a) (set (number 'b) (set) ') ')")
            )).eql({
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
                            item: '\'x$7',
                            tail: '(set)',
                            x$0: '',
                            x$1: '(set \'item \'tail \'x$2)',
                            x$2: '\'x$8',
                            x$3: '(number \'b)',
                            x$4: '\'x$0',
                            x$5: '\'x$0',
                            x$6: '(number \'b)',
                            x$7: '(number \'a)',
                            x$8: ''
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
                            item: '\'x$7',
                            tail: '(set)',
                            x$0: '',
                            x$1: '(set \'item \'tail \'x$2)',
                            x$2: '\'x$8',
                            x$3: '(number \'b)',
                            x$4: '\'x$0',
                            x$5: '\'x$0',
                            x$6: '(number \'b)',
                            x$7: '(number \'a)',
                            x$8: ''
                        }
                    }
                ]
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

            should(utils.tableFieldsToString(
                query("(set (number 'a) 'tail ')")
            )).eql({
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
                        bound: [ 'a', 'tail', 'x$0', 'x$1', 'x$2', 'x$3', 'x$4', 'x$5', 'x$6', 'x$7', 'x$8', 'x$9'],
                        vars: {
                            a: '\'x$3',
                            tail: '(set (number \'x$5) \'x$4 \'x$1)',
                            x$0: '(set (number \'x$3) \'x$4 \'x$2)',
                            x$1: '',
                            x$2: '1',
                            x$3: '0',
                            x$4: '(set)',
                            x$5: '\'x$2',
                            x$6: '\'x$1',
                            x$7: '',
                            x$8: '\'x$2',
                            x$9: ''
                        }
                    },
                    {
                        bound: [ 'a', 'tail', 'x$0', 'x$1', 'x$2', 'x$3', 'x$4', 'x$5', 'x$6', 'x$7', 'x$8', 'x$9'],
                        vars: {
                            a: '\'x$3',
                            tail: '(set (number \'x$5) \'x$4 \'x$1)',
                            x$0: '(set (number \'x$3) \'x$4 \'x$2)',
                            x$1: '',
                            x$2: '0',
                            x$3: '1',
                            x$4: '(set)',
                            x$5: '\'x$2',
                            x$6: '\'x$1',
                            x$7: '',
                            x$8: '\'x$2',
                            x$9: ''
                        }
                    }
                ]
            });
        });*/
    });
});