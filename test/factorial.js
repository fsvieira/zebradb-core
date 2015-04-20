var should = require("should");
var Z = require("../lib/z");
var ZQuery = require("../lib/zquery");


describe('Factorial Tests.', function() {
    describe('Natural Numbers', function() {
        it('Should declare a Peanno number', function () {
            var run, result;
            
            run = new ZQuery.Run(
                Z.d(
                    Z.t(Z.c("nat"), Z.c("0")),
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.v("n")))
                )
            );
            
            result = [];
            run.query (
                Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("1"))),
                function (q) {
                    result.push(q.toString());
                }
            );
            should(result.length).equal(0);
            
            result = [];
            run.query (
                Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0"))),
                function (q) {
                    result.push(q.toString());
                }
            );
            should(result).eql(["(nat (nat 0))"]);

            should(function () {
                var results = []; 
                try {
                    run.query(
                        Z.t(Z.c("nat"), Z.v("n")),
                        function (q) {
                            results.push(q.toString());
                            if (results.length >= 10) {
                                throw "Enough Results";
                            }
                        }
                    );
                } catch (e) {
                    if (e !== "Enough Results") {
                        throw e;
                    }
                }
                
                return results;
            }()).eql ([
                "(nat 'n = 0)",
                "(nat 'n = (nat 'n = 0))",
                "(nat 'n = (nat 'n = (nat 'n = 0)))",
                "(nat 'n = (nat 'n = (nat 'n = (nat 'n = 0))))",
                "(nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = 0)))))",
                "(nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = 0))))))",
                "(nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = 0)))))))",
                "(nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = 0))))))))",
                "(nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = 0)))))))))",
                "(nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = (nat 'n = 0))))))))))"
            ]);
        });
    });
});