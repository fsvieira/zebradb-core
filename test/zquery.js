var should = require("should");
var Z = require("../lib/z");
var ZQuery = require("../lib/zquery");

describe('ZQuery Tests.', function() {
    describe('Context Versions', function() {
        it('Define context and save, load and keep (empty)', function () {
            var ctx, q;
            ctx = new ZQuery.Context();

            should(ctx.save()).equal(0);
            should(ctx.load()).equal(0);
            should(ctx.keep()).equal(0);

        });
        
        it('Define context and save, load and keep (no changes)', function () {
            var ctx, q;
            
            ctx = new ZQuery.Context();
            q = ctx.get("q");

            should(ctx.save()).equal(1);
            should(ctx.load()).equal(0);
            should(ctx.keep()).equal(0);
        });

        it('Define context and save, load and keep (with changes)', function () {
            var ctx, q, yellow;
            
            ctx = new ZQuery.Context();
            q = ctx.get("q");
            yellow = new ZQuery.Constant("yellow");
            
            should(ctx.save()).equal(1);
            
            should(q.unify(yellow)).equal(true);
            should(q.getValue().toString()).equal("yellow");
            
            should(ctx.load()).equal(0);
            should(q.getValue()).equal(undefined);
            
            // Test keep
            should(q.unify(yellow)).equal(true);
            should(q.getValue().toString()).equal("yellow");
            
            should(ctx.keep()).equal(0);
            should(q.getValue().toString()).equal("yellow");

        });
        
        it('Should create a new tuple with a variable and keep version.', function () {
            var ctxA, ctxB, tA, tB;
            
            ctxA = new ZQuery.Context();
            tA = ZQuery.create(Z.t(Z.v("q")), ctxA);
            
            ctxB = new ZQuery.Context();
            tB = ZQuery.create(Z.t(Z.c("yellow")), ctxB);

            should(tA.context.save()).equal(1);
            should(tB.context.save()).equal(0);

        });

    });

    describe('Querys', function() {
        it('Query with single tuple constant.', function () {
            var run = new ZQuery.Run(
                Z.d(
                    Z.t(Z.c("yellow"))
                )
            );
            
            run.query(
                Z.t(Z.c("yellow")),
                function (q) {
                    should(q.toString()).equal("(yellow)");
                }
            );
            
            run.query(
                Z.t(Z.v("q")),
                function (q) {
                    should(q.toString()).equal("('q = yellow)");
                }
            );
            
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
            var ctxA = new ZQuery.Context();

            var r = ctxA.get("r");
            var a = ctxA.get("a");
            a.unify(new ZQuery.Constant("0"));
            r.unify(new ZQuery.Tuple([
                new ZQuery.Constant("nat"),
                a
            ], ctxA));

            var tA = new ZQuery.Tuple([
                            new ZQuery.Constant("nat"),
                            r
                        ], ctxA);

            var ctxB = new ZQuery.Context();
            var tB = new ZQuery.Tuple([
                            new ZQuery.Constant("nat"),
                            new ZQuery.Tuple([
                                new ZQuery.Constant("nat"),
                                ctxB.get("n")
                            ])
                        ], ctxB);            
            
            should(tA.toString()).equal("(nat 'r = (nat 'a = 0))");
            should(tB.toString()).equal("(nat (nat 'n))");

            should(tA.unify(tB)).equal(true);
            should(tB.unify(tA)).equal(true);

            // Invert order
            ctxA = new ZQuery.Context();

            r = ctxA.get("r");
            a = ctxA.get("a");
            a.unify(new ZQuery.Constant("0"));
            r.unify(new ZQuery.Tuple([
                new ZQuery.Constant("nat"),
                a
            ], ctxA));

            tA = new ZQuery.Tuple([
                            new ZQuery.Constant("nat"),
                            r
                        ], ctxA);

            ctxB = new ZQuery.Context();
            tB = new ZQuery.Tuple([
                            new ZQuery.Constant("nat"),
                            new ZQuery.Tuple([
                                new ZQuery.Constant("nat"),
                                ctxB.get("n")
                            ])
                        ], ctxB);            
            
            should(tA.toString()).equal("(nat 'r = (nat 'a = 0))");
            should(tB.toString()).equal("(nat (nat 'n))");

            should(tB.unify(tA)).equal(true);
            should(tA.unify(tB)).equal(true);
            
        });

       it("Should reset tuples variables", function () {
            // (nat 'r = (nat 'a = 0)) = (nat (nat 'n))
            var ctxA = new ZQuery.Context();

            var r = ctxA.get("r");
            var a = ctxA.get("a");
            a.unify(new ZQuery.Constant("0"));
            r.unify(new ZQuery.Tuple([
                new ZQuery.Constant("nat"),
                a
            ], ctxA));

            r.context.save();
            should(r.unify(new ZQuery.Constant("0"))).equal(false);

            r.context.load();
            should(r.unify(new ZQuery.Tuple([
                new ZQuery.Constant("nat"),
                a
            ], ctxA))).equal(true);
            
            should(r.toString()).equal("'r = (nat 'a = 0)");
        });

        it("Should unify tuples variables.", function () {
            // 'rm = (nat 'a = (nat (nat 0))) <=> (nat (nat 'b = (nat 0)))
            
            // 'rm = (nat 'a = (nat (nat 0)))
            var ctxA = new ZQuery.Context();
            var rm = ctxA.get("rm");
            var a = ctxA.get("a");
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
            var ctxB = new ZQuery.Context();
            var b = ctxB.get("b");

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