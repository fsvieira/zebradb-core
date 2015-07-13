var should = require("should");
var Z = require("../lib/z");

describe('Z Constructors test.', function() {
    describe('Constants', function() {
        it('Declare a Constant', function() {
            should(Z.c("yellow")).eql({ type: 'constant', value: 'yellow' });
        });
    });
    
    describe('Variables', function() {
        it('Declare a Variable', function() {
            should(Z.v("q")).eql({ type: 'variable', name: 'q' });
        });
    });
    
    describe('Tuples', function() {
        it('Declare a Tuple', function() {
            should(Z.t(Z.v("q"))).eql({ type: 'tuple', tuple: [{type: 'variable', name: 'q' }] });
        });
    });
    
    describe('Not', function() {
        it('Declare a Not ...', function() {
            should(Z.n(Z.c("yellow"))).eql({
                notEquals: [{ type: 'constant', value: 'yellow' }],
                type: 'variable'
            });
            
            should(Z.n(Z.v("q"))).eql({
                notEquals: [{ name: 'q', type: 'variable' }], 
                type: 'variable' 
            
            });
            
            should(Z.n(Z.t(Z.v("q")))).eql({
                notEquals: [{ tuple: [ { name: 'q', type: 'variable' } ], type: 'tuple' }],
                type: 'variable'
            });
        });
    });
});