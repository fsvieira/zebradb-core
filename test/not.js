var should = require("should");
var Z = require("../lib/z");
var ZQuery = require("../lib/zquery");

describe('ZQuery Tests.', function() {
    describe('Not Tests', function() {
        it('Should test the Not Constants', function () {
            var run;
            run = new ZQuery.Run(Z.d(
                Z.t(Z.c("color"), Z.c("yellow")),
                Z.t(Z.c("color"), Z.c("blue")),
                Z.t(Z.c("color"), Z.c("red")),
                Z.t(Z.c("color"), Z.c("white")),
                Z.t(Z.c("notYellow"), Z.t(Z.c("color"), Z.n(Z.c("yellow"))))
            ));
            
            should(run.queryArray(
                Z.t(Z.c("color"), Z.v())
            )).eql([
                "(color ' = yellow)",
                "(color ' = blue)",
                "(color ' = red)",
                "(color ' = white)"
            ]);
            
            should(run.queryArray(
                Z.t(Z.c("notYellow"), Z.v())
            )).eql([
                "(notYellow ' = (color ' = blue))",
                "(notYellow ' = (color ' = red))",
                "(notYellow ' = (color ' = white))"
            ]);
        });
        
        it('Should declare a Not-Equal', function () {
            var run;
            run = new ZQuery.Run(Z.d(
                Z.t(Z.c("equal"), Z.v("p"), Z.v("p")),
                Z.t(Z.c("notEqual"), Z.v("p"), Z.n(Z.v("p")))
            ));
            
            should(run.queryArray(
                Z.t(Z.c("equal"), Z.c("yellow"), Z.c("yellow"))
            )).eql([
                "(equal yellow yellow)"
            ]);
            
            should(run.queryArray(
                Z.t(Z.c("equal"), Z.c("yellow"), Z.c("blue"))
            )).eql([]);
            
            
            should(run.queryArray(
                Z.t(Z.c("notEqual"), Z.c("yellow"), Z.c("yellow"))
            )).eql([]);
            
            should(run.queryArray(
                Z.t(Z.c("notEqual"), Z.c("yellow"), Z.c("blue"))
            )).eql([
                "(notEqual yellow blue)"
            ]);
        });
        
        it('Should make distinct tuples', function () {
            var run;
            run = new ZQuery.Run(
                "(color yellow)" +
                "(color blue)" +
                "(color red)" +
                "(distinct 'item ^'item)"
            );
            
            should(run.queryArray("(distinct (color 'a) (color 'b))")).eql([
                "(distinct (color 'a = blue) (color 'b = yellow))",
                "(distinct (color 'a = red) (color 'b = yellow))",
                "(distinct (color 'a = yellow) (color 'b = blue))",
                "(distinct (color 'a = red) (color 'b = blue))",
                "(distinct (color 'a = yellow) (color 'b = red))",
                "(distinct (color 'a = blue) (color 'b = red))"
            ]);
        });
    });
});