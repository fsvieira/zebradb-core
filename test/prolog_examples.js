var should = require("should");
var Z = require("../lib/z");

/*
  Online prolog examples converted to zebra system.
*/

describe('Prolog examples port Tests.', function() {

    it('Should query people about what they like.', function () {
        var run = new Z();
        
        run.add(
            "(mary likes food)" +
            "(mary likes wine)" +
            "(john likes wine)" +
            "(john likes mary)" 
        );

        should(run.print("?(mary likes food)")).eql("@(mary likes food)");
        should(run.print("?(john likes wine)")).eql("@(john likes wine)");
        should(run.print("?(john likes food)")).eql("");

        should(run.print("?(mary likes 'stuff)")).eql(
            "@(mary likes food)\n@(mary likes wine)"
        );
    });

    it('Should query about what john likes.', function () {
        var run = new Z();
        
        // 1. John likes anything that Mary likes 
        run.add("\
            (mary likes food ')\
            (mary likes wine ')\
            (john likes 'stuff (mary likes 'stuff '))\
            "
        );
        
        should(run.print("?(john likes 'stuff 'p)")).eql(
            "@(john likes food @(mary likes food '))\n" + 
            "@(john likes wine @(mary likes wine '))"
        );
    });

    it('Should fail on insufficient definitions.', function () {
        var run = new Z();
        
        run.add(
            "(john likes 'person ('person likes wine '))"
        );

        // (john likes 'stuff 'p).(john likes 'person ('person likes wine '))
        // (john likes 'stuff='person 'p=('person likes wine '))
        // ('person likes wine ').(john likes 'person ('person likes wine ')
        // ('person=john likes 'person2=wine ('person2=wine likes wine '))
        // ('person2=wine likes wine ').(john likes 'person ('person likes wine '))
        // wine != john -> fail.
        should(run.print("?(john likes 'stuff 'p)")).eql("");

    });

    it('Should query what john likes, he likes anyone who likes wine.', function () {
        var run = new Z();
        
        run.add(
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
        
        should(run.print("?(john likes 'stuff 'p)")).eql(
            "@(john likes wine ')\n" + 
            "@(john likes mary @(mary likes wine '))\n" +
            "@(john likes john @(john likes wine '))"
        );
    });

    it('Should query what john likes, he likes what mary likes and people that like wine.', function () {
        var run = new Z();
        
        run.add(
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
        
        should(run.print("?(john likes 'stuff 'p)")).eql(
            "@(john likes wine ')\n" +
            "@(john likes mary ')\n" +
            "@(john likes food @(mary likes food '))\n" +
            "@(john likes wine @(mary likes wine '))\n" +
            "@(john likes mary @(mary likes wine '))\n" +
            "@(john likes john @(john likes wine '))\n" +
            "@(john likes john @(john likes wine @(mary likes wine ')))"
        );
    });

    it('Should query john likes people that like themselves.', function () {
        var run = new Z();
        
        run.add(
            "(john likes wine ')" + // likes(john,wine).

            // 1. John likes anyone who likes wine
            "(john likes 'person ('person likes wine '))" +

            // 2. John likes anyone who likes themselves
            // "(john likes 'person ('person likes 'person '))" // this is recursive by itself.
            // john can't like himself just because it likes himself.
            "(john likes 'person ('person likes 'person 'p) ^(equal 'person 'person))" +
            "(equal 'x 'x)"
        );
        
        should(run.print("?(john likes 'stuff 'p)")).eql(
            "@(john likes wine ')\n" +
            "@(john likes john @(john likes wine '))"
        );
    });

    it('Should query people about what they like (Extended).', function () {
        var run = new Z();
        
        run.add(
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
            // "(john likes 'person ('person likes 'person '))" // this is recursive by itself.
            // john can't like himself just because it likes himself.
            "(john likes 'person ('person likes 'person 'p) ^(equal 'person 'person))" +
            "(equal 'x 'x)"
        );
        
        should(run.print("?(john likes 'stuff 'p)")).eql(
            "@(john likes wine ')\n" +
            "@(john likes mary ')\n" +
            "@(john likes food @(mary likes food '))\n" +
            "@(john likes wine @(mary likes wine '))\n" +
            "@(john likes mary @(mary likes wine '))\n" +
            "@(john likes john @(john likes wine '))\n" +
            "@(john likes john @(john likes wine @(mary likes wine ')))"
        );
    });

    it('Should give no results to circular definition.', function () {
        var run = new Z(5);
        
        run.add(
            "(john likes 'person ('person likes 'person '))"
        );
        
        // Query is not able to stop on their own.
        should(run.print("?(john likes 'stuff 'p)")).eql("");
    });
});