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
                query: '?(john likes \'stuff \'p)',
                result: [
                    {
                      bound: [ 'p', 'stuff', 'x$0', 'x$1', 'x$2' ],
                      vars: {
                        p: '(mary likes \'x$1 \'x$0)',
                        stuff: '\'x$1',
                        x$0: '\'x$2',
                        x$1: 'food',
                        x$2: ''
                      }
                    },
                    {
                      bound: [ 'p', 'stuff', 'x$0', 'x$1', 'x$2' ],
                      vars: {
                        p: '(mary likes \'x$1 \'x$0)',
                        stuff: '\'x$1',
                        x$0: '\'x$2',
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

        it('Should query what john likes, he likes anyone who likes wine.', function () {

            var query = Z.run(
                "(mary likes wine ')" + // likes(mary,wine).
                "(john likes wine ')" + // likes(john,wine).

                // 2. John likes anyone who likes wine
                "(john likes 'person ('person likes wine '))"
                
                // (john likes 'stuff 'p) . (john likes 'person ('person likes wine '))
                // =>   stuff = person
                //      p = (person likes wine ')
                // (person likes wine ') . (mary likes wine ') => person = mary
                // (person likes wine ') . (john likes wine ') => person = john
                // (person1 likes wine ') . (john likes 'person2 ('person2 likes wine ')) 
                // =>   person1 = john, person2 = wine
                //      (wine likes wine ') FAIL. 
            );
            
            should(utils.tableFieldsToString(
                query("(john likes 'stuff 'p)")
            )).eql({
                query: '?(john likes \'stuff \'p)',
                result: [
                    {
                      bound: [ 'p', 'stuff', 'x$0' ],
                      vars: { p: '\'x$0', stuff: 'wine', x$0: '' }
                    },
                    {
                      bound: [ 'p', 'person', 'stuff', 'x$0', 'x$1' ],
                      vars: {
                        p: '(\'person likes wine \'x$0)',
                        person: 'mary',
                        stuff: '\'person',
                        x$0: '\'x$1',
                        x$1: ''
                      }
                    },
                    {
                      bound: [ 'p', 'person', 'stuff', 'x$0', 'x$1' ],
                      vars: {
                        p: '(\'person likes wine \'x$0)',
                        person: 'john',
                        stuff: '\'person',
                        x$0: '\'x$1',
                        x$1: ''
                      }
                    }
                ]
            });
        });

        it('Should query what john likes, he likes what mary likes and people that like wine.', function () {

            var query = Z.run(
                "(mary likes food ')" + // likes(mary,food).
                "(mary likes wine ')" + // likes(mary,wine).
                "(john likes wine ')" + // likes(john,wine).
                "(john likes mary ')" + // likes(john,mary).
                "(peter likes peter ')" + // likes(peter,peter).

                // 1. John likes anything that Mary likes
                "(john likes 'stuff (mary likes 'stuff '))" +

                // 2. John likes anyone who likes wine
                "(john likes 'person ('person likes wine '))"
            );
            
            should(utils.tableFieldsToString(
                query("(john likes 'stuff 'p)")
            )).eql( {
                query: '?(john likes \'stuff \'p)',
                result: [
                    {
                        bound: [ 'p', 'stuff', 'x$0' ],
                        vars: { p: '\'x$0', stuff: 'wine', x$0: '' }
                    },
                    {
                        bound: [ 'p', 'stuff', 'x$0' ],
                        vars: { p: '\'x$0', stuff: 'mary', x$0: '' }
                    },
                    {
                        bound: [ 'p', 'stuff', 'x$0', 'x$1', 'x$2' ],
                        vars: {
                            p: '(mary likes \'x$1 \'x$0)',
                            stuff: '\'x$1',
                            x$0: '\'x$2',
                            x$1: 'food',
                            x$2: ''
                      }
                    },
                    {
                        bound: [ 'p', 'stuff', 'x$0', 'x$1', 'x$2' ],
                        vars: {
                            p: '(mary likes \'x$1 \'x$0)',
                            stuff: '\'x$1',
                            x$0: '\'x$2',
                            x$1: 'wine',
                            x$2: ''
                        }
                    },
                    {
                        bound: [ 'p', 'person', 'stuff', 'x$0', 'x$1' ],
                        vars: {
                            p: '(\'person likes wine \'x$0)',
                            person: 'mary',
                            stuff: '\'person',
                            x$0: '\'x$1',
                            x$1: ''
                        }
                    },
                    {
                        bound: [ 'p', 'person', 'stuff', 'x$0', 'x$1' ],
                        vars: {
                            p: '(\'person likes wine \'x$0)',
                            person: 'john',
                            stuff: '\'person',
                            x$0: '\'x$1',
                            x$1: ''
                        }
                    },
                    {
                        bound: [ 'p', 'person', 'stuff', 'x$0', 'x$1', 'x$2', 'x$3' ],
                        vars: {
                            p: '(\'person likes wine \'x$0)',
                            person: 'john',
                            stuff: '\'person',
                            x$0: '(mary likes \'x$2 \'x$1)',
                            x$1: '',
                            x$2: 'wine',
                            x$3: '\'x$1'
                        }
                    }
                ]
            });
        });

/*
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
                "(list)" +
                "(list 'item (list))" +
                "(list 'item (list ''))" +
                // "(john likes 'person ('person likes 'person '))" // this is recursive by itself.
                //"(john likes 'person (list " +
                //    "('person likes 'person ')" +
                //    "(list (notEqual 'person john) (list))" +
                //"))" +
                
                "(john likes 'person (list " +
                    "(notEqual 'person john)" +
                    "(list ('person likes 'person ') (list))" +
                "))" +

                "(notEqual 'x ^'x)"
                // ---
                // (john likes 'stuff ') . (john likes 'person ('person likes 'person '))
                // (john likes 'stuff='person '=('person likes 'person '))
                // ('person likes 'person ') . (john likes 'person ('person likes 'person '))
                // (john likes john '=(john likes john '))
            );
            
            should(utils.tableFieldsToString(
                query("(john likes 'stuff 'p)")
            )).eql({
                query: '?(john likes \'stuff \'p)',
                result: [
                    {
                        bound: [ 'p', 'stuff', 'x$0' ],
                        vars: { p: '\'x$0', stuff: 'wine', x$0: '' }
                    },
                    {
                        bound: [ 'p', 'stuff', 'x$0' ],
                        vars: { p: '\'x$0', stuff: 'mary', x$0: '' }
                    },
                    {
                        bound: [ 'p', 'stuff', 'x$0', 'x$1', 'x$2' ],
                        vars: {
                            p: '(mary likes \'x$1 \'x$0)',
                            stuff: '\'x$1',
                            x$0: '\'x$2',
                            x$1: 'food',
                            x$2: ''
                        }
                    },
                    {
                        bound: [ 'p', 'stuff', 'x$0', 'x$1', 'x$2' ],
                        vars: {
                            p: '(mary likes \'x$1 \'x$0)',
                            stuff: '\'x$1',
                            x$0: '\'x$2',
                            x$1: 'wine',
                            x$2: ''
                        }
                    },
                    {
                        bound: [ 'p', 'person', 'stuff', 'x$0', 'x$1' ],
                        vars: {
                            p: '(\'person likes wine \'x$0)',
                            person: 'mary',
                            stuff: '\'person',
                            x$0: '\'x$1',
                            x$1: ''
                        }
                    },
                    {
                        bound: [ 'p', 'person', 'stuff', 'x$0', 'x$1' ],
                        vars: {
                            p: '(\'person likes wine \'x$0)',
                            person: 'john',
                            stuff: '\'person',
                            x$0: '\'x$1',
                            x$1: ''
                        }
                    },
                    {
                        bound: [ 'p', 'person', 'stuff', 'x$0', 'x$1', 'x$2', 'x$3' ],
                        vars: {
                            p: '(\'person likes wine \'x$0)',
                            person: 'john',
                            stuff: '\'person',
                            x$0: '(mary likes \'x$2 \'x$1)',
                            x$1: '',
                            x$2: 'wine',
                            x$3: '\'x$1'
                        }
                    },
                    {
                        bound: [ 'item', 'p', 'person', 'stuff', 'x', 'x$0', 'x$1', 'x$2', 'x$3', 'x$4', 'x$5' ],
                        vars: {
                            item: '(notEqual \'person john)',
                            p: '(list (notEqual \'person john) (list (\'person likes \'person \'x$0) (list)))',
                            person: 'peter',
                            stuff: '\'person',
                            x: '\'person',
                            x$0: '',
                            x$1: '(list)',
                            x$2: '(\'person likes \'person \'x$0)',
                            x$3: 'john',
                            x$4: '(\'person likes \'person \'x$0)',
                            x$5: '\'x$0'
                        }
                    }
                ]
            });
        });*/
    });
});