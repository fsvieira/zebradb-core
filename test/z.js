var should = require("should");
var Z = require("../lib/z");

describe('Z Constructors test.', function() {
    describe('Constants', function() {
        it('Declare a Constant', function() {
            should(Z.c("yellow")).eql({ type: 'constant', data: 'yellow' });
        });
    });
    
    describe('Variables', function() {
        it('Declare a Variable', function() {
            should(Z.v("q")).eql({ type: 'variable', data: 'q' });
        });
    });
    
    describe('Tuples', function() {
        it('Declare a Tuple', function() {
            should(Z.t(Z.v("q"))).eql({ type: 'tuple', data: [{type: 'variable', data: 'q' }] });
        });
    });
    
    describe('Not', function() {
        it('Declare a Not ...', function() {
            should(Z.n(Z.c("yellow"))).eql(
                { data: { data: 'yellow', type: 'constant' }, type: 'not' }
            );
            
            should(Z.n(Z.v("q"))).eql(
                { data: { data: 'q', type: 'variable' }, type: 'not' }
            );
            
            should(Z.n(Z.t(Z.v("q")))).eql({
                data: { data: [ { data: 'q', type: 'variable' } ], type: 'tuple' },
                type: 'not'
            });
        });
    });
});