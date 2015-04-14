var should = require("should");
var M = require("../lib/variable");

describe('SetValues(), on simple conditions', function ( ) {
	describe('set values on no domain variables.', function () {
		it('should set value on uninitialized variable.', function () {
			var a = new M.Variable("A");

			// should(a.getValues()).eql([]);

			var yellow = new M.Constant("yellow");
			var ac = a.context();
			should(ac.getValue()).equal(undefined);
			should(ac.unify(yellow)).equal(true);
			should(ac.getValue()).equal("yellow");
			// should(a.getValues()).eql(["yellow"]);
		});
		
		it('should set value on uninitialized unified variables.', function () {
			var a = new M.Variable().context();
			var b = new M.Variable().context();
			var yellow = new M.Constant("yellow");
		
			a.unify(b);

			should(a.getValue()).equal(undefined);
			// should(a.getValues()).eql([]);
			should(b.getValue()).equal(undefined);
			//should(b.getValues()).eql([]);

			should(a.unify(yellow)).equal(true);
			should(a.getValue()).equal("yellow");
			// should(a.getValues()).eql(["yellow"]);

			should(b.getValue()).equal("yellow");
			// should(b.getValues()).eql(["yellow"]);
		});

		it('should set value on uninitialized and initilized unified variables.', function () {
			var a = new M.Variable().context();
			var yellow = new M.Constant("yellow");
			var b = new M.Constant("yellow");

			should(b.getValue()).equal("yellow");
			// should(b.getValues()).eql(["yellow"]);

			should(a.getValue()).equal(undefined);
			// should(a.getValues()).eql([]);
		
			a.unify(b);

			should(a.unify(yellow)).equal(true);
			should(a.getValue()).equal("yellow");
			// should(a.getValues()).eql(["yellow"]);

			should(b.getValue()).equal("yellow");
			// should(b.getValues()).eql(["yellow"]);
		});

		it('should set value on uninitialized and initilized unified variables (swap order).', function () {
			var a = new M.Variable().context();
			var b = new M.Constant("yellow");

			should(b.getValue()).equal("yellow");
			/* should(b.getValues()).eql(["yellow"]); */

			should(a.getValue()).equal(undefined);
			/* should(a.getValues()).eql([]);*/
		
			b.unify(a);

			should(a.unify(new M.Constant("yellow"))).equal(true);
			should(a.getValue()).equal("yellow");
			/* should(a.getValues()).eql(["yellow"]);*/

			should(b.getValue()).equal("yellow");
			/* should(b.getValues()).eql(["yellow"]);*/
		});
		
		// TODO: clean up tests, most of them dont make sense anymore,
		/*it('should set value on uninitialized and initilized unified variables (multiple values).', function () {
			var a = new M.Variable();
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
		});*/
	});

});
