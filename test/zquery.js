var should = require("should");
var Z = require("../lib/z");
var utils = require("../lib/utils");

describe('ZQuery Tests.', function() {
    describe('Querys', function() {
        it('Query with single tuple constant.', function () {
            var query = Z.run([
                Z.t(Z.c("yellow"))
            ]);
            
            
            should(
                query(
                    Z.t(Z.c("yellow"))
                )
            ).eql({
                query: {
                    bound: [],
                    tuple: [ { type: 'constant', value: 'yellow' } ],
                    type: 'tuple'
                },
                result: [ {vars: {}, bound: [] } ]
            });
            
            should(
                query(
                    Z.t(Z.v("q"))
                )
            ).eql({
                query: {
                    bound: [ 'q' ],
                    tuple: [ { name: 'q', type: 'variable' } ],
                    type: 'tuple'
                },
                result: [
                    {
                      bound: [ 'q' ],
                      vars: {
                            q: {
                                notEquals: undefined,
                                type: 'value',
                                value: { type: 'constant', value: 'yellow' },
                                variable: { name: 'q', type: 'variable' }
                            }
                        }
                    }
                ]
            });
        });

        it('Should identify variables by name.', function () {

            var defs = [Z.t(Z.v("q"), Z.v("q"))];
            var query = Z.run(defs);

            should(defs).eql(
                [
                    {
                        tuple: [
                            { name: 'q', type: 'variable' },
                            { name: 'q', type: 'variable' }
                        ],
                        type: 'tuple'
                    }
                ]
            );

            should(utils.tableFieldsToString(
                query(
                    Z.t(Z.c("yellow"), Z.v("p"))
                )
            )).eql({
                query: '?(yellow \'p)',
                result: [ { bound: [ 'p', 'q' ], vars: { p: 'yellow', q: '\'p' } } ]
            });

            query = Z.run([ 
                Z.t(Z.v("q")), // ('q)
                Z.t( // (('q) ('q))
                    Z.t(Z.v("q")), 
                    Z.t(Z.v("q"))
                )
            ]);

            should(
                utils.tableFieldsToString(
                    query(
                        Z.t(
                            Z.t(Z.c("yellow")),
                            Z.t(Z.v("p"))
                        )
                    )
                )
            ).eql({
                query: '?((yellow) (\'p))',
                result: [
                    {
                      bound: [ 'p', 'q', 'x$0', 'x$1' ],
                      vars: { p: '\'q', q: 'yellow', x$0: 'yellow', x$1: '' }
                    }
                ]
            });
        });

        it("Should unify variables with tuple values", function () {
            var query = Z.run([ 
                Z.t(
                    Z.c("blue"),
                    Z.c("red"), 
                    Z.c("yellow")
                )
            ]);
            
            should(
                utils.tableFieldsToString(
                    query(
                        Z.t(
                            Z.v("a"),
                            Z.v("b"), 
                            Z.v("c")
                        )
                    )
                )
            ).eql({
                query: "?('a 'b 'c)",
                result: [
                    {
                        bound: [ 'a', 'b', 'c' ],
                        vars: {
                            a: 'blue',
                            b: 'red',
                            c: 'yellow'
                        }
                    }
                ]
            });
        });

        it("Should unify tuples variables.", function () {
            
            var query = Z.run([ 
                Z.t(Z.v("a"), Z.v("a"))
            ]);
            
            should(
                utils.tableFieldsToString(
                    query(
                        Z.t(Z.c("yellow"), Z.v("c")) 
                    )
                )
            ).eql({
                query: '?(yellow \'c)',
                result: [ { bound: [ 'a', 'c' ], vars: { a: '\'c', c: 'yellow' } } ]
            });


            query = Z.run([
                Z.t(Z.v("x"), Z.v("y")),
                Z.t(Z.t(Z.v("a"), Z.v("a"))) 
            ]);
            
            should(
                utils.tableFieldsToString(
                    query(
                        Z.t(Z.t(Z.c("yellow"), Z.v("c")))
                    )
                )
            ).eql({
                query: '?((yellow \'c))',
                result: [
                    {
                      bound: [ 'a', 'c', 'x', 'y' ],
                      vars: { a: '\'c', c: 'yellow', x: 'yellow', y: '\'c' }
                    }
                ]
            });

            query = Z.run([
                Z.t(Z.c("yellow"), Z.c("blue")),
                Z.t(Z.c("blue"), Z.c("yellow")),
                Z.t(
                    Z.t(Z.v("a"), Z.v("b")), 
                    Z.t(Z.v("b"), Z.v("a"))
                )
            ]);
            
            should(
                utils.tableFieldsToString(
                    query(
                        Z.t(
                            Z.t(Z.c("yellow"), Z.v("c")), 
                            Z.t(Z.c("blue"), Z.v("d"))
                        )
                    )
                )
            ).eql({
                query: '?((yellow \'c) (blue \'d))',
                result: [
                    {
                        bound: [ 'a', 'b', 'c', 'd' ],
                        vars: { a: 'yellow', b: '\'c', c: 'blue', d: '\'a' }
                    }
                ]
            });
        });
    });
});

