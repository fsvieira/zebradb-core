var should = require("should");
var Z = require("../lib/z");


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
                result: [ { bound: [] } ]
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
                                variable: { name: 'q', type: 'variable' } // TODO: change var to name.
                            }
                        }
                    }
                ]
            });
        });
        
        it('Should identify variables by name.', function () {
            var run = new ZQuery.Run(
                Z.d(
                    Z.t(Z.v("q"), Z.v("q"))
                )
            );
            
            should(
                run.queryArray(
                    Z.t(Z.c("yellow"), Z.v("p"))
                )
            ).eql(["(yellow 'p = yellow)"]);
            
            run = new ZQuery.Run(
                Z.d(
                    Z.t(Z.v("q")),
                    Z.t(
                        Z.t(Z.v("q")),
                        Z.t(Z.v("q"))
                    )
                )
            );
            
            should(run.queryArray(
                Z.t(
                    Z.t(Z.c("yellow")),
                    Z.t(Z.v("p"))
                )
            )).eql(["((yellow) ('p = yellow))"]);
        });
        
        it("Should unify variables with tuple values", function () {
            // (nat 'r = (nat 'a = 0)) = (nat (nat 'n))
            var r = new ZQuery.Variable("r");
            var a = new ZQuery.Variable("a");
            a.unify(new ZQuery.Constant("0"));
            r.unify(new ZQuery.Tuple([
                new ZQuery.Constant("nat"),
                a
            ]));

            var tA = new ZQuery.Tuple([
                        new ZQuery.Constant("nat"),
                        r
                    ]);

            var tB = new ZQuery.Tuple([
                        new ZQuery.Constant("nat"),
                        new ZQuery.Tuple([
                            new ZQuery.Constant("nat"),
                            new ZQuery.Variable("n")
                        ])
                    ]);            
            
            should(tA.toString()).equal("(nat 'r = (nat 'a = 0))");
            should(tB.toString()).equal("(nat (nat 'n))");

            should(tA.unify(tB)).equal(true);
            should(tB.unify(tA)).equal(true);

            // Invert order
            r = new ZQuery.Variable("r");
            a = new ZQuery.Variable("a");
            a.unify(new ZQuery.Constant("0"));
            r.unify(new ZQuery.Tuple([
                new ZQuery.Constant("nat"),
                a
            ]));

            tA = new ZQuery.Tuple([
                new ZQuery.Constant("nat"),
                r
            ]);

            tB = new ZQuery.Tuple([
                new ZQuery.Constant("nat"),
                new ZQuery.Tuple([
                    new ZQuery.Constant("nat"),
                        new ZQuery.Variable("n")
                ])
            ]);            
            
            should(tA.toString()).equal("(nat 'r = (nat 'a = 0))");
            should(tB.toString()).equal("(nat (nat 'n))");

            should(tB.unify(tA)).equal(true);
            should(tA.unify(tB)).equal(true);
            
        });

       it("Should reset tuples variables", function () {
            // (nat 'r = (nat 'a = 0)) = (nat (nat 'n))
            var r = new ZQuery.Variable("r");
            var a = new ZQuery.Variable("a");
            
            a.unify(new ZQuery.Constant("0"));
            r.unify(new ZQuery.Tuple([
                new ZQuery.Constant("nat"),
                a
            ]));

            var load = r.save();
            should(r.unify(new ZQuery.Constant("0"))).equal(false);

            load();
            should(r.unify(new ZQuery.Tuple([
                new ZQuery.Constant("nat"),
                a
            ]))).equal(true);
            
            should(r.toString()).equal("'r = (nat 'a = 0)");
        });

        it("Should unify tuples variables.", function () {
            // 'rm = (nat 'a = (nat (nat 0))) <=> (nat (nat 'b = (nat 0)))
            
            // 'rm = (nat 'a = (nat (nat 0)))
            var rm = new ZQuery.Variable("rm");
            var a = new ZQuery.Variable("a");
            
            a.unify(
                new ZQuery.Tuple([
                    new ZQuery.Constant("nat"),
                    new ZQuery.Tuple([
                        new ZQuery.Constant("nat"),
                        new ZQuery.Constant("0")
                    ])
                ])
            );
            
            should(a.toString()).equal("'a = (nat (nat 0))");
            
            rm.unify(new ZQuery.Tuple([
                new ZQuery.Constant("nat"),
                a
            ]));
            
            should(rm.toString()).equal("'rm = (nat 'a = (nat (nat 0)))");
            
            
            // (nat (nat 'b = (nat 0)))
            var b = new ZQuery.Variable("b");

            b.unify(
                new ZQuery.Tuple([
                        new ZQuery.Constant("nat"),
                        new ZQuery.Constant("0")
                ])
            );
            
            should(b.toString()).equal("'b = (nat 0)");

            var tupleB = new ZQuery.Tuple([
                new ZQuery.Constant("nat"),
                new ZQuery.Tuple([
                    new ZQuery.Constant("nat"),
                    b
                ])
            ]);
            
            should(tupleB.toString()).equal("(nat (nat 'b = (nat 0)))");
            
            should(rm.unify(tupleB)).equal(true);

            should(rm.toString()).equal("'rm = (nat 'a = (nat (nat 0)))");
            should(tupleB.toString()).equal("(nat (nat 'b = (nat 0)))");

        });
   
    });

});