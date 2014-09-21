var should = require("should");
var v = require("../lib/variable").v;

describe('Variable', function(){
  describe('#getValue()', function(){
    it('should return variable init value', function() {
		should(v().getValue()).equal(undefined);
		should(v({domain: ["blue"]}).getValue()).equal("blue");
		should(v({domain: [5]}).getValue()).be.exactly(5).and.be.a.Number;
		should(v({domain: [0.5]}).getValue()).be.exactly(0.5).and.be.a.Number;
		should(v({domain: [null]}).getValue()).equal(null);
		should(v({domain: [true]}).getValue()).equal(true);
		should(v({domain: [false]}).getValue()).equal(false);
		should(v({domain: ["red", "blue"]}).getValue()).equal(undefined);
    })
  });
  
  describe('#getValues()', function(){
    it('should return variable init domain', function() {
		should(v().getValues()).be.instanceof(Array).and.have.lengthOf(0);
		should(v({domain: ["blue", "yellow"]}).getValues()).be.instanceof(Array).and.have.lengthOf(2);
    })
  });
  
  describe('#unify()', function(){
    it('should return true if unify ok, otherwise false', function() {
		should(v().unify(v())).equal(true);
		should(v().unify(v({domain: ["blue"]}))).equal(true);
		should(v({domain: ["blue"]}).unify(v())).equal(true);
		should(v({domain: ["blue"]}).unify(v({domain: ["blue"]}))).equal(true);
		should(v({domain: ["blue"]}).unify(v({domain: ["yellow"]}))).equal(false);
		should(v({domain: ["blue", "yellow"]}).unify(v({domain: ["blue", "yellow"]}))).equal(true);
		should(v({domain: ["blue", "yellow", "red"]}).unify(v({domain: ["blue", "yellow", "white"]}))).equal(true);
		should(v({domain: ["blue", "yellow"]}).unify(v({domain: ["red", "white"]}))).equal(false);
	});
	
	it('should unify vars and setup domains', function () {
		var a = v();
		should(a.unify(v({domain: ["blue"]}))).equal(true);
		should(a.getValue()).equal("blue");
		
		var a = v();
		should(a.unify(v({domain: ["blue", "red"]}))).equal(true);
		should(a.getValues().indexOf("blue") !== -1).equal(true);
		should(a.getValues().indexOf("red") !== -1).equal(true);
		
		var a = v({domain: [1, 2, 3]});
		var b = v({domain: [3, 4, 5]});
		
		should(a.unify(b)).equal(true);
		should(a.getValue()).be.exactly(3).and.be.a.Number;
		should(b.getValue()).be.exactly(3).and.be.a.Number;
    });
    
  });
  
	describe('#notUnify()', function(){
		it('should notUnify by ref', function() {
			var a = v();
			var b = v();
			should(a.notUnify(b)).equal(true);
			should(a.setValue("blue")).equal(true);
			should(b.setValue("blue")).equal(false);
			
			var a = v();
			var b = v();
			var c = v();
			should(a.notUnify(b)).equal(true);
			should(b.unify(c)).equal(true);
			should(a.unify(c)).equal(false);
		});
		
		it('should notUnify by value', function() {
			var a = v({domain: ["blue"]});
			var b = v({domain: ["yellow"]});
			should(a.notUnify(b)).equal(true);
			
			var a = v({domain: ["blue", "yellow"]});
			var b = v({domain: ["yellow"]});
			should(a.notUnify(b)).equal(true);
			should(a.getValue()).equal("blue");
			should(b.getValue()).equal("yellow");

			var a = v({domain: ["blue", "yellow"]});
			var b = v({domain: ["yellow", "blue"]});
			should(a.notUnify(b)).equal(true);
			should(a.getValue()).equal(undefined);
			should(b.getValue()).equal(undefined);
		});
		
		it('should not notUnify by value', function() {
			var a = v({domain: ["blue"]});
			var b = v({domain: ["blue"]});
			should(a.notUnify(b)).equal(false);
		});
		
	});
  
	describe('#setValue()', function(){
		it('should return true if setValue ok, otherwise false', function() {
			var a=v();
			should(a.setValue("a")).equal(true);
			should(a.getValue("a")).equal("a");
			
			var a = v();
			should(a.setValue(1)).equal(true);
			should(a.getValue()).be.exactly(1).and.be.a.Number;
			
			var a = v({domain: [1, 2, 3]});
			should(a.setValue(1)).equal(true);
			should(a.getValue()).be.exactly(1).and.be.a.Number;
			
			var a = v({domain: [2, 3]});
			should(a.setValue(1)).equal(false);
			should(a.getValue()).equal(undefined);
			should(a.getValues().indexOf(2) !== -1).equal(true);
			should(a.getValues().indexOf(3) !== -1).equal(true);
			should(a.getValues().indexOf(1) !== -1).equal(false);
			should(a.getValues().indexOf("2") !== -1).equal(false);
			
		});
	});
	
	describe('#setNoValue()', function(){
		it('should return true if setValue ok, otherwise false', function() {
			var a = v({domain: ["yellow", "blue", "red"]});
			should(a.getValue()).equal(undefined);
			should(a.setNoValue("yellow")).equal(true);
			should(a.setNoValue("red")).equal(true);
			should(a.getValue()).equal("blue");
		});
	});
})
