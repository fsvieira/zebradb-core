var should = require("should");
var Z = require("../lib/z");

/*
  Online prolog examples converted to run on zebra lib
*/

describe('Prolog examples port Tests.', function() {
    describe('Simple Facts', function() {
        it('Should query people about what they like.', function () {

            var run = new Z.Run(
                "(mary likes food)" + // likes(mary,food).
                "(mary likes wine)" + // likes(mary,wine).
                "(john likes wine)" + // likes(john,wine).
                "(john likes mary)"   // likes(john,mary).
            );
            
            var query = function (q) {
                return Z.toString(run.query(q));
            };

            // Query the facts,
            should(
                query("(mary likes food)")
            ).eql("(mary likes food)");

            should(
                query("(john likes wine)")
            ).eql("(john likes wine)");

            should(
                query("(john likes food)")
            ).eql("");
            
            should(
                query("(mary likes 'stuff)")
            ).eql("(mary likes food)\n(mary likes wine)");
        });

        it('Should query about what john likes.', function () {
            var run = new Z.Run(
                "(mary likes food ')" + // likes(mary,food).
                "(mary likes wine ')" + // likes(mary,wine).
                // 1. John likes anything that Mary likes 
                "(john likes 'stuff (mary likes 'stuff '))"
            );

            var query = function (q) {
                return Z.toString(run.query(q));
            };

            should(
                query("(john likes 'stuff 'p)")
            ).eql(
                "(john likes food (mary likes food \'x$2))\n" +
                "(john likes wine (mary likes wine \'x$2))"
            );
        });

        it('Should fail on insufficient definitions.', function () {

            var run = new Z.Run(
                "(john likes 'person ('person likes wine '))"
            );
            
            var query = function (q) {
                return Z.toString(run.query(q));
            };
            
            // (john likes 'stuff 'p).(john likes 'person ('person likes wine '))
            // (john likes 'stuff='person 'p=('person likes wine '))
            // ('person likes wine ').(john likes 'person ('person likes wine ')
            // ('person=john likes 'person2=wine ('person2=wine likes wine '))
            // ('person2=wine likes wine ').(john likes 'person ('person likes wine '))
            // wine != john -> fail.

            should(
                query("(john likes 'stuff 'p)")
            ).eql("");
        });

        it('Should query what john likes, he likes anyone who likes wine.', function () {

            var run = new Z.Run(
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
            
            var query = function (q) {
                return Z.toString(run.query(q));
            };
            
            should(
                query("(john likes 'stuff 'p)")
            ).eql(
                "(john likes wine \'x$0)\n" +
                "(john likes mary (mary likes wine \'x$1))\n" +
                "(john likes john (john likes wine \'x$1))");
        });

        it('Should query what john likes, he likes what mary likes and people that like wine.', function () {

            var run = new Z.Run(
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
            
            var query = function (q) {
                return Z.toString(run.query(q));
            };
            
            // TODO: remove prevent duplicated created by multiply.
            should(
                query("(john likes 'stuff 'p)")
            ).eql(
                "(john likes wine \'x$0)\n" +
                "(john likes mary \'x$0)\n" +
                "(john likes food (mary likes food \'x$2))\n" +
                "(john likes wine (mary likes wine \'x$2))\n" +
                "(john likes mary (mary likes wine \'x$1))\n" +
                "(john likes john (john likes wine \'x$1))\n" +
                "(john likes john (john likes wine (mary likes wine \'x$0)))\n" +
                "(john likes wine (mary likes wine \'x$2))\n" +
                "(john likes mary (mary likes wine \'x$1))\n" +
                "(john likes john (john likes wine (mary likes wine \'x$0)))"
            );
            
        });

        it('Should query people about what they like (Extended).', function () {
            var run = new Z.Run(
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
                "(john likes 'person (list " +
                    "('person likes 'person ')" +
                    "(list (notEqual 'person john) (list))" +
                "))" +
                
                //"(john likes 'person (list " +
                //    "(notEqual 'person john)" +
                //    "(list ('person likes 'person ') (list))" +
                // "))" +
                
                // TODO: TEST THAT THIS WILL RUN FOREVER.
                // "(john likes 'person ('person likes 'person '))" +

                "(notEqual 'x ^'x)"
                // ---
                // (john likes 'stuff ') . (john likes 'person ('person likes 'person '))
                // (john likes 'stuff='person '=('person likes 'person '))
                // ('person likes 'person ') . (john likes 'person ('person likes 'person '))
                // (john likes john '=(john likes john '))
            );
            
            var query = function (q) {
                return Z.toString(run.query(q));
            };
            
            should(
                query("(john likes 'stuff 'p)")
            ).eql(
                /*
                "(john likes wine \'x$0)\n" +
                "(john likes mary \'x$0)\n" +
                "(john likes food (mary likes food \'x$2))\n" +
                "(john likes wine (mary likes wine \'x$2))\n" +
                "(john likes mary (mary likes wine \'x$1))\n" +
                "(john likes john (john likes wine \'x$1))\n" +
                "(john likes john (john likes wine (mary likes wine \'x$0)))\n" +
                "(john likes peter (list (peter likes peter \'x$1) (list (notEqual peter john) (list))))");
                */
                "(john likes wine \'x$0)\n" +
                "(john likes mary \'x$0)\n" +
                "(john likes food (mary likes food \'x$2))\n" +
                "(john likes wine (mary likes wine \'x$2))\n" +
                "(john likes mary (mary likes wine \'x$1))\n" +
                "(john likes john (john likes wine \'x$1))\n" +
                "(john likes john (john likes wine (mary likes wine \'x$0)))\n" +
                "(john likes peter (list (peter likes peter \'x$1) (list (notEqual peter john) (list))))\n" +
                "(john likes wine (mary likes wine \'x$2))\n" +
                "(john likes mary (mary likes wine \'x$1))\n" +
                "(john likes john (john likes wine (mary likes wine \'x$0)))"
            );
        });

        it('Should give no results to circular definition.', function () {
            var run = new Z.Run(
                "(john likes 'person ('person likes 'person '))"
            );
            
            var query = function (q, len) {
                return Z.toString(run.query(q, len));
            };
            
            should(
                query("(john likes 'stuff 'p)", 5000)
            ).eql("");
        });
    });
});