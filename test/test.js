var should = require("should");
var Variable = require("../lib/variable");
var backtrack = require("../lib/backtrack");


describe('Variable', function(){
  describe('#getValue()', function(){
    it('should return variable init value', function() {
		var v = new Variable().v;
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
		var v = new Variable().v;
		should(v().getValues()).be.instanceof(Array).and.have.lengthOf(0);
		should(v({domain: ["blue", "yellow"]}).getValues()).be.instanceof(Array).and.have.lengthOf(2);
    })
  });
  
  describe('#unify()', function(){
    it('should return true if unify ok, otherwise false', function() {
		var v = new Variable().v;
		should(v().unify(v())).equal(true);
		should(v().unify(v({domain: ["blue"]}))).equal(true);
		should(v({domain: ["blue"]}).unify(v())).equal(true);
		should(v({domain: ["blue"]}).unify(v({domain: ["blue"]}))).equal(true);
		should(v({domain: ["blue"]}).unify(v({domain: ["yellow"]}))).equal(false);
		should(v({domain: ["blue", "yellow"]}).unify(v({domain: ["blue", "yellow"]}))).equal(true);
		should(v({domain: ["blue", "yellow", "red"]}).unify(v({domain: ["blue", "yellow", "white"]}))).equal(true);
		should(v({domain: ["blue", "yellow"]}).unify(v({domain: ["red", "white"]}))).equal(false);
	});
	
	it('should set values on unified variables', function () {
		var v = new Variable().v;
		var a = v({domain: [1, 2, 3]});
		var b = v();
		var c = v({domain: [1, 2]});
	
		should(a.unify(b)).equal(true);
		should(c.notUnify(b)).equal(true);

		should(b.getValues()).eql([1, 2, 3]);

		should(a.setValue(1)).equal(true);
		should(a.getValue()).equal(1);
		should(b.getValue()).equal(1);
		should(c.getValue()).equal(2);
	});
	
	it('should unify vars and setup domains', function () {
		var v = new Variable().v;
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
			var v = new Variable().v;
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
			var v = new Variable().v;
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
			var v = new Variable().v;
			var a = v({domain: ["blue"]});
			var b = v({domain: ["blue"]});
			should(a.notUnify(b)).equal(false);
		});
		
		it('should use notUnify to make distinct variables', function () {
			var v = new Variable().v;
			var a = v({domain: [0, 1, 2]});
			var b = v({domain: [0, 1, 2]});
			var c = v({domain: [0, 1, 2]});

			should(a.getValue()).equal(undefined);
			should(b.getValue()).equal(undefined);
			should(c.getValue()).equal(undefined);

			// a != b, a != c; b != c 
			should(a.notUnify(b)).equal(true);
			should(a.notUnify(c)).equal(true);
			should(b.notUnify(c)).equal(true);

			should(c.setValue(0)).equal(true);
			should(a.getValues()).eql([1,2]);
			should(b.getValues()).eql([1,2]);

			should(a.getValue()).equal(undefined);
			should(b.getValue()).equal(undefined);
			should(c.getValue()).equal(0);
			
			should(a.setValue(2)).equal(true);
			should(b.getValues()).eql([1]);

			should(a.getValue()).equal(2);
			should(b.getValue()).equal(1);
			should(c.getValue()).equal(0);

			// 
			var a=v({domain: [1, 2, 3, 4]});
			var b=v({domain: [1, 2, 3, 4]});
			var c=v({domain: [1, 2, 3, 4]});
			var d=v({domain: [1, 2, 3, 4]});

			should(a.notUnify(b)).equal(true);
			should(a.notUnify(c)).equal(true);
			should(a.notUnify(d)).equal(true);

			should(b.notUnify(c)).equal(true);
			should(b.notUnify(d)).equal(true);

			should(c.notUnify(d)).equal(true);
			
			should(a.setValue(2)).equal(true);
			should(b.setValue(2)).equal(false);
			should(c.setValue(2)).equal(false);
			should(d.setValue(2)).equal(false);

		});
		
		it('should set domain correct values when notUnify', function () {
			var v = new Variable().v;
			var a = v({domain: [1]});
			var b = v({domain: [0, 1]});

			should(a.notUnify (b)).equal(true);
			
			should(a.getValue()).equal(1);
			should(b.getValue()).equal(0);
		});
		
	});
  
	describe('#setValue()', function(){
		it('should return true if setValue ok, otherwise false', function() {
			var v = new Variable().v;
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
			var v = new Variable().v;
			var a = v({domain: ["yellow", "blue", "red"]});
			should(a.getValue()).equal(undefined);
			should(a.setNoValue("yellow")).equal(true);
			should(a.setNoValue("red")).equal(true);
			should(a.getValue()).equal("blue");
		});
	});
	
	describe('#onvalue()', function(){
		it('should fire on value (once) when value is set', function(done) {
			var v = new Variable().v;
			var a = v();
			a.onvalue (function (a, value) {
				should(a.getValue()).equal(value);
				should(value).equal("blue");
				done();
			});
			
			a.setValue("blue");
		});
		
		it('should fire on value (once) when value is found', function(done) {
			var v = new Variable().v;
			var a = v({domain: ["blue", "yellow"]});
			a.onvalue (function (a, value) {
				should(a.getValue()).equal(value);
				should(value).equal("blue");
				done();
			});
			
			a.setNoValue("yellow");
		});
	});

	it("should solve brave puzzle", function () {
		// Every row, column AND the main diagonals contain all the letters in the word "BRAVE".

		var v = new Variable().v;
		var brave = [
			"B", "R", "A", "V", "E",
			"" , "E", "B", "R", "" ,
			"" , "" , "V", "" , "B",
			"" , "B", "R", "" , "" ,
			"" , "" , "E", "B", "" 			
		];
		
		var solution = {
			rows: {},
			cols: {},
			dig: {a: [], b: []},
			all: []
		};
		
		brave.forEach (function (letter, index) {
			var y = Math.floor(index/5);
			var x = index - y*5;
			var p = v((letter==="")?{domain: ["B", "R", "A", "V", "E"]}:{domain: [letter]});
			
			(solution.rows[y] = solution.rows[y] || []).push(p);
			(solution.cols[x] = solution.cols[x] || []).push(p);
			solution.all.push(p);
			
			if (x === y) {solution.dig.a.push(p);}
			if (x === (4-y)) {solution.dig.b.push(p);}

		});
		
		function distinct (groups) {
			for (var g in groups) {
				var vars = groups[g];

				// mk all vars in this group distinct,
				for (var i=0; i!==vars.length; i++) {
					var a = vars[i];
					for (var j=i+1; j!==vars.length; j++) {
						var b = vars[j];
						should(a.notUnify(b)).equal(true);
					}
				}
			}
		}
		
		distinct (solution.rows);
		distinct (solution.cols);
		distinct (solution.dig);

		function isBrave (vars) {
			var is = [];
			
			vars.forEach (function (v) {
				is.push(v.getValue());
			});
			
			is.sort(function (a, b) {
				return b < a;
			});
		
			return is;
		};

		function allBrave (groups) {
			for (var g in groups) {
				should(isBrave(groups[g])).eql(["A", "B", "E", "R", "V"]);
			}
		};
		
		allBrave (solution.rows);
		allBrave (solution.cols);
		allBrave (solution.dig);
	});
	
	describe('#backtrack', function(){
		it("should generate all binary values [0, 1, 2, 3]", function () {
			var factory = new Variable();  
			var v = factory.v;
  
			var a = v({domain: [0, 1]});
			var b = v({domain: [0, 1]});

			var numbers = [];
			function number() {
				numbers.push(a.getValue() * 2 + b.getValue());
			};

			backtrack (factory, number);
			
			should(numbers).eql([0, 1, 2, 3]);
		});
	});
});



