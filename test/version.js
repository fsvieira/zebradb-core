var should = require("should");
var Variable = require("../lib/variable");

describe('Variable', function ( ) {
	describe('#version', function () {
		it('should not increment version on commit when no changes', function () {
			var factory = new Variable();
			var v = factory.v;

			should(v({domain: ["blue"]}).getValue()).equal("blue");
			should(v({domain: ["yellow"]}).getValue()).equal("yellow");
			
			should(factory.commit()).equal(0);
			should(factory.commit()).equal(0);
		});

		it('should restore commited variables states', function () {
			var factory = new Variable();
			var v = factory.v;
			var a = v({domain: ["blue", "yellow"]});
			should(factory.commit()).equal(0);
			should(a.getValues()).eql(["blue", "yellow"]);
			should(a.setValue("blue")).equal(true);
			should(a.getValues()).eql(["blue"]);

			should(factory.reset(0)).equal(0);
			should(a.getValues()).eql(["blue", "yellow"]);
		});

		it('should commit to next version (1)', function () {
			var factory = new Variable();
			var v = factory.v;
			var a = v({domain: ["blue", "yellow"]});
			should(factory.commit()).equal(0);
			should(a.getValues()).eql(["blue", "yellow"]);
			should(a.setValue("blue")).equal(true);
			should(a.getValues()).eql(["blue"]);

			should(a.isUpdate()).equal(false);

			should(factory.commit()).equal(1);
		});

		it('should rebase changes to init version', function () {
			var factory = new Variable();
			var v = factory.v;
			var a = v({domain: ["blue", "yellow"]});
			should(factory.commit()).equal(0);
			should(a.getValues()).eql(["blue", "yellow"]);
			should(a.setValue("blue")).equal(true);
			should(a.getValues()).eql(["blue"]);

			should(a.isUpdate()).equal(false);

			should(factory.commit()).equal(1);

			should(factory.rebase(0)).equal(1);
			should(a.getValues()).eql(["blue"]);
		});
		
		it('should reset commited versions', function () {
			var f = new Variable();
			var v = f.v;
			var a = v({domain: [0, 1]});
			var b = v({domain: [0, 1]});
			var versionA, versionB;
			
			// a = [0,1]
			should(versionA = f.commit()).equal(0);
			
			// a = 0
			should(a.setValue(0)).equal(true);
			should(a.getValue()).equal(0);
			
				// b = 0,
				should(versionB = f.commit()).equal(1);
				should(b.setValue(0)).equal(true);
				
				should(a.getValue()).equal(0);
				should(b.getValue()).equal(0);
				
				should(f.getVars().length).equal(2);

				should(f.reset(versionB)).equal(1);
				should(f.getVars().length).equal(2);
				// b = 1,
				should(b.setValue(1)).equal(true);
				
				should(a.getValue()).equal(0);
				should(b.getValue()).equal(1);
				
				should(f.reset(versionB)).equal(1);
			
			// a = 1,
			should(f.reset(versionA)).equal(0);
			should(a.setValue(1)).equal(true);
			should(a.getValue()).equal(1);
			
				// b = 0,
				should(versionB = f.commit()).equal(1);
				should(b.setValue(0)).equal(true);
				
				should(a.getValue()).equal(1);
				should(b.getValue()).equal(0);
				
				should(f.reset(versionB)).equal(1);
				
				// b = 1,
				should(b.setValue(1)).equal(true);
				
				should(a.getValue()).equal(1);
				should(b.getValue()).equal(1);
				
				should(f.reset(versionB)).equal(1);
			
			// a = [0,1]
			should(versionA).equal(0);
			should(f.reset(versionA)).equal(0);
			should(a.getValue()).equal(undefined);
			should(a.getValues()).eql([0,1]);
			
		});
	});

});
