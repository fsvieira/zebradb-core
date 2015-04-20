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
    });

});