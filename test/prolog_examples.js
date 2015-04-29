var should = require("should");
var Z = require("../lib/z");
// var ZQuery = require("../lib/zquery_debug");
var ZQuery = require("../lib/zquery");

/*
  Online prolog examples converted to run on zebra lib
*/

describe('Prolog examples port Tests.', function() {
    describe('Simple Facts', function() {
        it('Should query people about what they like.', function () {
            
            //    likes(mary,food).
            //    likes(mary,wine).
            //    likes(john,wine).
            //    likes(john,mary).

            var run; 
            run = new ZQuery.Run(
                Z.d(
                    Z.t(Z.c("mary"), Z.c("likes"), Z.c("food")), // likes(mary,food).
                    Z.t(Z.c("mary"), Z.c("likes"), Z.c("wine")), // likes(mary,wine).
                    Z.t(Z.c("john"), Z.c("likes"), Z.c("wine")), // likes(john,wine).
                    Z.t(Z.c("john"), Z.c("likes"), Z.c("mary"))  // likes(john,mary).
                )
            );
            
            // Query the facts,
            should(run.queryArray(
                Z.t(Z.c("mary"), Z.c("likes"), Z.c("food"))
            )).eql(["(mary likes food)"]);
            
            should(run.queryArray(
                Z.t(Z.c("john"), Z.c("likes"), Z.c("wine"))
            )).eql(["(john likes wine)"]);
            
            should(run.queryArray(
                Z.t(Z.c("john"), Z.c("likes"), Z.c("food"))
            )).eql([]);

            should(run.queryArray(
                Z.t(Z.c("mary"), Z.c("likes"), Z.v("stuff"))
            )).eql([
                "(mary likes 'stuff = food)",
                "(mary likes 'stuff = wine)"
            ]);
        });
        
        it('Should query about what john likes.', function () {
            var run; 
            run = new ZQuery.Run(
                Z.d(
                    Z.t(Z.c("mary"), Z.c("likes"), Z.c("food"), Z.v()), // likes(mary,food).
                    Z.t(Z.c("mary"), Z.c("likes"), Z.c("wine"), Z.v()), // likes(mary,wine).
                    
                    // 1. John likes anything that Mary likes 
                    Z.t(
                        Z.c("john"), Z.c("likes"), Z.v("stuff"),
                        Z.t(
                            Z.c("mary"), Z.c("likes"), Z.v("stuff"), Z.v()
                        )
                    )
                )
            );
            
            should(run.queryArray(
                Z.t(
                    Z.c("john"), Z.c("likes"), Z.v("stuff"),
                    Z.v("p")
                )
            )).eql([
                "(john likes 'stuff = food 'p = (mary likes 'stuff = food '))",
                "(john likes 'stuff = wine 'p = (mary likes 'stuff = wine '))"
            ]);
        });
       
        it('Should query people about what they like (Extended).', function () {
            // How do you add the following facts?
            
            // likes(mary,food).
            // likes(mary,wine).
            // likes(john,wine).
            // likes(john,mary).
                
            var run;
            
            run = new ZQuery.Run(
                Z.d(
                    Z.t(Z.c("mary"), Z.c("likes"), Z.c("food"), Z.v()), // likes(mary,food).
                    Z.t(Z.c("mary"), Z.c("likes"), Z.c("wine"), Z.v()), // likes(mary,wine).
                    Z.t(Z.c("john"), Z.c("likes"), Z.c("wine"), Z.v()), // likes(john,wine).
                    Z.t(Z.c("john"), Z.c("likes"), Z.c("mary"), Z.v()), // likes(john,mary).

                    Z.t(Z.c("peter"), Z.c("likes"), Z.c("peter"), Z.v()), // likes(peter,peter).

                    // 1. John likes anything that Mary likes 
                    Z.t(
                        Z.c("john"), Z.c("likes"), Z.v("stuff"),
                        Z.t(
                            Z.c("mary"), Z.c("likes"), Z.v("stuff"), Z.v()
                        )
                    ),
                    
                    // 2. John likes anyone who likes wine 
                    Z.t(
                        Z.c("john"), Z.c("likes"), Z.v("person"),
                        Z.t(
                            Z.v("person"), Z.c("likes"), Z.c("wine"), Z.v()
                        )
                    ),
                    
                    Z.t(Z.c("notEqual"), Z.v("p"), Z.n(Z.v("p"))),
                    Z.t(Z.v(), Z.v()),
                    
                    // 3. John likes anyone who likes themselves
                    Z.t(
                        Z.c("john"), Z.c("likes"), Z.v("person"),
                        Z.t(Z.v("person"), Z.c("likes"), Z.v("person"), Z.t(Z.c("notEqual"), Z.v("person"), Z.c("john")))
                    ),
                    
                    // john likes john
                    Z.t(
                        Z.c("john"), Z.c("likes"), Z.c("john"), Z.v()
                    )
                )
            );

            should(run.queryArray(
                Z.t(
                    Z.c("john"), Z.c("likes"), Z.v("stuff"),
                    Z.v("p")
                )
            )).eql([
                "(john likes 'stuff = wine 'p)",
                "(john likes 'stuff = mary 'p)",
                "(john likes 'stuff = food 'p = (mary likes 'stuff = food '))",
                "(john likes 'stuff = wine 'p = (mary likes 'stuff = wine '))",
                "(john likes 'stuff = mary 'p = ('person = mary likes wine '))",
                "(john likes 'stuff = john 'p = ('person = john likes wine '))",
                "(john likes 'stuff = john 'p = ('person = john likes wine ' = (mary likes 'stuff = wine ')))",
                "(john likes 'stuff = peter 'p = ('person = peter likes 'person = peter (notEqual 'person = peter john)))",
                "(john likes 'stuff = john 'p)"
            ]);
            
            // console.log(ZQuery.Run.logger.toString());
            
            // Mary doesnt like things, even john doesnt like things 
            // so this should fail.
            /*should(run.queryArray(
                Z.t(
                    Z.c("john"), Z.c("likes"), Z.c("things"),
                    Z.v("p")
                )
            )).eql([]);
            
            
            // Mary doesnt like things, even john doesnt like things 
            // so this should fail.
            should(run.queryArray(
                Z.t(
                    Z.c("john"), Z.c("likes"), Z.c("food"),
                    Z.v()
                )
            )).eql(["(john likes food ' = (mary likes 'stuff = food '))"]);
            */
        });
    });

});