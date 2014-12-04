var should = require("should");
var Variable = require("../lib/variable");

describe('SetValues(), on simple conditions', function ( ) {
	describe('set values on no domain variables.', function () {
		it('should set value on uninitialized variable.', function () {
			var factory = new Variable();
			var v = factory.v;
			
			var a = v();

			should(a.getValue()).equal(undefined);
			should(a.getValues()).eql([]);

			should(a.setValue("yellow")).equal(true);
			should(a.getValue()).equal("yellow");
			should(a.getValues()).eql(["yellow"]);
		});
		
		it('should set value on uninitialized unified variables.', function () {
			var factory = new Variable();
			var v = factory.v;
			
			var a = v();
			var b = v();
		
			a.unify(b);

			should(a.getValue()).equal(undefined);
			should(a.getValues()).eql([]);
			should(b.getValue()).equal(undefined);
			should(b.getValues()).eql([]);

			should(a.setValue("yellow")).equal(true);
			should(a.getValue()).equal("yellow");
			should(a.getValues()).eql(["yellow"]);

			should(b.getValue()).equal("yellow");
			should(b.getValues()).eql(["yellow"]);
		});

		it('should set value on uninitialized and initilized unified variables.', function () {
			var factory = new Variable();
			var v = factory.v;
			
			var a = v();
			var b = v({domain: ["yellow"]});

			should(b.getValue()).equal("yellow");
			should(b.getValues()).eql(["yellow"]);

			should(a.getValue()).equal(undefined);
			should(a.getValues()).eql([]);
		
			a.unify(b);

			should(a.setValue("yellow")).equal(true);
			should(a.getValue()).equal("yellow");
			should(a.getValues()).eql(["yellow"]);

			should(b.getValue()).equal("yellow");
			should(b.getValues()).eql(["yellow"]);
		});

		it('should set value on uninitialized and initilized unified variables (swap order).', function () {
			var factory = new Variable();
			var v = factory.v;
			
			var a = v();
			var b = v({domain: ["yellow"]});

			should(b.getValue()).equal("yellow");
			should(b.getValues()).eql(["yellow"]);

			should(a.getValue()).equal(undefined);
			should(a.getValues()).eql([]);
		
			b.unify(a);

			should(a.setValue("yellow")).equal(true);
			should(a.getValue()).equal("yellow");
			should(a.getValues()).eql(["yellow"]);

			should(b.getValue()).equal("yellow");
			should(b.getValues()).eql(["yellow"]);
		});
		
		it('should set value on uninitialized and initilized unified variables (multiple values).', function () {
			var factory = new Variable();
			var v = factory.v;
			
			var a = v();
			var b = v({domain: ["yellow", "blue"]});

			should(b.getValue()).equal(undefined);
			should(b.getValues()).eql(["yellow", "blue"]);

			should(a.getValue()).equal(undefined);
			should(a.getValues()).eql([]);
		
			a.unify(b);

			should(a.setValue("yellow")).equal(true);
			should(a.getValue()).equal("yellow");
			should(a.getValues()).eql(["yellow"]);

			should(b.getValue()).equal("yellow");
			should(b.getValues()).eql(["yellow"]);
		});

		it('should set value on uninitialized and initilized unified variables (multiple values, swap order).', function () {
			var factory = new Variable();
			var v = factory.v;
			
			var a = v();
			var b = v({domain: ["yellow", "blue"]});

			should(b.getValue()).equal(undefined);
			should(b.getValues()).eql(["yellow", "blue"]);

			should(a.getValue()).equal(undefined);
			should(a.getValues()).eql([]);
		
			b.unify(a);

			should(a.setValue("yellow")).equal(true);
			should(a.getValue()).equal("yellow");
			should(a.getValues()).eql(["yellow"]);

			should(b.getValue()).equal("yellow");
			should(b.getValues()).eql(["yellow"]);
		});
	});

});
