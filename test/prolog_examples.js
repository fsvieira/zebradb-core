var should = require("should");
var Z = require("../lib/z");
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

            var run, result; 
            run = new ZQuery.Run(
                Z.d(
                    Z.t(Z.c("mary"), Z.c("likes"), Z.c("food")), // likes(mary,food).
                    Z.t(Z.c("mary"), Z.c("likes"), Z.c("wine")), // likes(mary,wine).
                    Z.t(Z.c("john"), Z.c("likes"), Z.c("wine")), // likes(john,wine).
                    Z.t(Z.c("john"), Z.c("likes"), Z.c("mary"))  // likes(john,mary).
                )
            );
            
            // Query the facts,
            run.query(
                Z.t(Z.c("mary"), Z.c("likes"), Z.c("food")),
                function (q) {
                    should(q.toString()).equal("(mary likes food)");
                }
            );
            
            run.query(
                Z.t(Z.c("john"), Z.c("likes"), Z.c("wine")),
                function (q) {
                    should(q.toString()).equal("(john likes wine)");
                }
            );
            
            result = 0;
            run.query(
                Z.t(Z.c("john"), Z.c("likes"), Z.c("food")),
                function (q) {
                    result++;
                }
            );

            should(result).equal(0);
            
            result = [];
            run.query(
                Z.t(Z.c("mary"), Z.c("likes"), Z.v("stuff")),
                function (q) {
                    result.push(q.toString());
                }
            );

            should(result).eql([ 
                "(mary likes 'stuff = food)",
                "(mary likes 'stuff = wine)",
            ]);
            
        });
        
        it('Should query people about what they like (Extended).', function () {
            // How do you add the following facts?
            
            // likes(mary,food).
            // likes(mary,wine).
            // likes(john,wine).
            // likes(john,mary).
                
            var result, run;
            
            run = new ZQuery.Run(
                Z.d(
                    Z.t(Z.c("mary"), Z.c("likes"), Z.c("food"), Z.v()), // likes(mary,food).
                    Z.t(Z.c("mary"), Z.c("likes"), Z.c("wine"), Z.v()), // likes(mary,wine).
                    Z.t(Z.c("john"), Z.c("likes"), Z.c("wine"), Z.v()), // likes(john,wine).
                    Z.t(Z.c("john"), Z.c("likes"), Z.c("mary"), Z.v()), // likes(john,mary).

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
                    )
                    
                    // 3. John likes anyone who likes themselves
                    /*, Z.t(
                        Z.c("john"), Z.c("likes"), Z.v("person"),
                        Z.t(
                            Z.v("person"), Z.c("likes"), Z.v("person"), Z.v()
                        )
                    )*/
                    /*Z.t(
                        Z.c("john"), Z.c("likes"), Z.v("john"),
                        Z.v()
                    )*/
                )
            );

            result = [];            
            run.query(
                Z.t(
                    Z.c("john"), Z.c("likes"), Z.v("stuff"),
                    Z.v("p")
                ),
                function (q) {
                    result.push(q.toString());
                }
            );
            should(result).eql([
                "(john likes 'stuff = wine 'p)",
                "(john likes 'stuff = mary 'p)",
                "(john likes 'stuff = food 'p = (mary likes 'stuff = food '))",
                "(john likes 'stuff = wine 'p = (mary likes 'stuff = wine '))",
                "(john likes 'stuff = mary 'p = ('person = mary likes wine '))",
                "(john likes 'stuff = john 'p = ('person = john likes wine '))",
                "(john likes 'stuff = john 'p = ('person = john likes wine ' = (mary likes 'stuff = wine ')))"
            ]);
            
            result = [];
            // Mary doesnt like things, even john doesnt like things 
            // so this should fail.
            run.query(
                Z.t(
                    Z.c("john"), Z.c("likes"), Z.c("things"),
                    Z.v("p")
                ),
                function (q) {
                    result.push(q.toString());
                }
            );
            
            should(result).eql([]);
            
            
            result = [];
            // Mary doesnt like things, even john doesnt like things 
            // so this should fail.
            run.query(
                Z.t(
                    Z.c("john"), Z.c("likes"), Z.c("food"),
                    Z.v()
                ),
                function (q) {
                    result.push(q.toString());
                }
            );
            
            should(result).eql(["(john likes food ' = (mary likes 'stuff = food '))"]);
            
            
        });
    });

});