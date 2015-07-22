var should = require("should");
var Z = require("../lib/z");
var utils = require("../lib/utils");

/*
  Online prolog examples converted to run on zebra lib
*/

describe('Prolog examples port Tests.', function() {
    describe('Simple Facts', function() {
        it('Should query people about what they like.', function () {

            var query = Z.run(
                "(mary likes food)" + // likes(mary,food).
                "(mary likes wine)" + // likes(mary,wine).
                "(john likes wine)" + // likes(john,wine).
                "(john likes mary)"   // likes(john,mary).
            );

            // Query the facts,
            should(utils.tableFieldsToString(
                query("(mary likes food)")
            )).eql({
                "query":"?(mary likes food)",
                "result":[{"vars":{},"bound":[]}]
            });

            should(utils.tableFieldsToString(
                query("(john likes wine)")
            )).eql({
                "query":"?(john likes wine)",
                "result":[{"vars":{},"bound":[]}]
            });

            should(utils.tableFieldsToString(
                query("(john likes food)")
            )).eql({ query: "?(john likes food)" });
            
            should(utils.tableFieldsToString(
                query("(mary likes 'stuff)")
            )).eql({
                query: "?(mary likes 'stuff)",
                result: [
                    { bound: [ 'stuff' ], vars: { stuff: 'food' } },
                    { bound: [ 'stuff' ], vars: { stuff: 'wine' } }
                ]
            });
        });
        
        it('Should query about what john likes.', function () {
            var query = Z.run(
                "(mary likes food ')" + // likes(mary,food).
                "(mary likes wine ')" + // likes(mary,wine).
                // 1. John likes anything that Mary likes 
                "(john likes 'stuff (mary likes 'stuff '))"
            );

            should(utils.tableFieldsToString(
                query("(john likes 'stuff 'p)")
            )).eql({
                query: "?(john likes 'stuff 'p)",
                result: [
                    {
                        bound: [ 'x$2', 'stuff', 'p', 'x$1', 'x$0' ],
                        vars: {
                            p: "(mary likes 'x$1 'x$0)",
                            stuff: "'x$1",
                            x$0: "'x$2",
                            x$1: 'food',
                            x$2: ''
                        }
                    },
                    {
                        bound: [ 'x$2', 'stuff', 'p', 'x$1', 'x$0' ],
                        vars: {
                            p: "(mary likes 'x$1 'x$0)",
                            stuff: "'x$1",
                            x$0: "'x$2",
                            x$1: 'wine',
                            x$2: ''
                        }
                    }
                ]
            });
        });

        it('Should fail on insufficient definitions.', function () {

            var query = Z.run(
                "(john likes 'person ('person likes wine '))"
            );
            
            // (john likes 'stuff 'p).(john likes 'person ('person likes wine '))
            // (john likes 'stuff='person 'p=('person likes wine '))
            // ('person likes wine ').(john likes 'person ('person likes wine ')
            // ('person=john likes 'person2=wine ('person2=wine likes wine '))
            // ('person2=wine likes wine ').(john likes 'person ('person likes wine '))
            // wine != john -> fail.

            should(utils.tableFieldsToString(
                query("(john likes 'stuff 'p)")
            )).eql({
                "query": "?(john likes 'stuff 'p)"
            });
        });
        

       it('Should query people about what they like (Extended).', function () {

            var query = Z.run(
                "(mary likes food ')" + // likes(mary,food).
                "(mary likes wine ')" + // likes(mary,wine).
                "(john likes wine ')" + // likes(john,wine).
                "(john likes mary ')" + // likes(john,mary).
                "(peter likes peter ')" + // likes(peter,peter).

                // 1. John likes anything that Mary likes
                "(john likes 'stuff (mary likes 'stuff '))" +

                // 2. John likes anyone who likes wine
                "(john likes 'person ('person likes wine '))" +

                // 3. John likes anyone who likes themselves
                "(john likes 'person ('person likes 'person '))" // this is recursive by itself.

                // ---
                // (john likes 'stuff ') . (john likes 'person ('person likes 'person '))
                // (john likes 'stuff='person '=('person likes 'person '))
                // ('person likes 'person ') . (john likes 'person ('person likes 'person '))
                // (john likes john '=(john likes john '))
            );
            
            should(utils.tableFieldsToString(
                // TODO: solve query with no deep restrictions.
                query("(john likes 'stuff 'p)", 2)
            )).eql({
                  query: '?(john likes \'stuff \'p)',
                  result: [
                    {
                      bound: [ 'stuff', 'p', 'x$0' ],
                      vars: { p: '\'x$0', stuff: 'wine', x$0: '' }
                    },
                    {
                      bound: [ 'stuff', 'p', 'x$0' ],
                      vars: { p: '\'x$0', stuff: 'mary', x$0: '' }
                    },
                    {
                      bound: [ 'x$2', 'stuff', 'p', 'x$1', 'x$0' ],
                      vars: {
                        p: '(mary likes \'x$1 \'x$0)',
                        stuff: '\'x$1',
                        x$0: '\'x$2',
                        x$1: 'food',
                        x$2: ''
                      }
                    },
                    {
                      bound: [ 'x$2', 'stuff', 'p', 'x$1', 'x$0' ],
                      vars: {
                        p: '(mary likes \'x$1 \'x$0)',
                        stuff: '\'x$1',
                        x$0: '\'x$2',
                        x$1: 'wine',
                        x$2: ''
                      }
                    },
                    {
                      bound: [ 'x$1', 'stuff', 'p', 'person', 'x$0' ],
                      vars: {
                        p: '(\'person likes wine \'x$0)',
                        person: 'mary',
                        stuff: '\'person',
                        x$0: '\'x$1',
                        x$1: ''
                      }
                    },
                    {
                      bound: [ 'x$1', 'stuff', 'p', 'person', 'x$0' ],
                      vars: {
                        p: '(\'person likes wine \'x$0)',
                        person: 'john',
                        stuff: '\'person',
                        x$0: '\'x$1',
                        x$1: ''
                      }
                    },
                    {
                      bound: [ 'x$1', 'stuff', 'p', 'person', 'x$0' ],
                      vars: {
                        p: '(\'person likes \'person \'x$0)',
                        person: 'peter',
                        stuff: '\'person',
                        x$0: '\'x$1',
                        x$1: ''
                      }
                    }
                  ]
                });
     });
    });

});