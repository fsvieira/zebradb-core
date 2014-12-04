var should = require("should");
var VariableFactory = require("../lib/variable");

describe("Gen Testcase", function() {
	/*it("should v_12 !== v_5, value=6 not in 6", function() {
		var f_0 = new VariableFactory();
		var v_3 = f_0.v({domain:[7], });
		var v_4 = f_0.v({domain:[1,2,3,4,5,6,7,8,9], });
		var v_5 = f_0.v({domain:[1,2,3,4,5,6,7,8,9], });
		var v_9 = f_0.v({domain:[1], });
		var v_12 = f_0.v({domain:[1,2,3,4,5,6,7,8,9], });
		var v_14 = f_0.v({domain:[1,2,3,4,5,6,7,8,9], });
		var v_21 = f_0.v({domain:[4], });
		var v_22 = f_0.v({domain:[3], });
		var v_41 = f_0.v({domain:[9], });
		var v_59 = f_0.v({domain:[1], });
		var v_77 = f_0.v({domain:[1,2,3,4,5,6,7,8,9], });
		should(v_3.notUnify(v_5)).eql(true);
		should(v_4.notUnify(v_5)).eql(true);
		should(v_9.notUnify(v_14)).eql(true);
		should(v_12.notUnify(v_14)).eql(true);
		should(v_5.notUnify(v_14)).eql(true);
		should(v_5.notUnify(v_41)).eql(true);
		should(v_5.notUnify(v_59)).eql(true);
		should(v_5.notUnify(v_77)).eql(true);
		should(v_14.notUnify(v_41)).eql(true);
		should(v_14.notUnify(v_77)).eql(true);
		should(v_3.notUnify(v_14)).eql(true);
		should(v_4.notUnify(v_14)).eql(true);
		should(v_5.notUnify(v_12)).eql(true);
		should(v_5.notUnify(v_21)).eql(true);
		should(v_5.notUnify(v_22)).eql(true);
		should(v_14.notUnify(v_21)).eql(true);
		should(v_14.notUnify(v_22)).eql(true);
		should(v_77.setValue(2)).eql(true);
		should(v_4.setValue(5)).eql(true);
//	Equal value is on not equal variables domains
//	v_12 !== v_5, value=6 not in 6
		should(v_3.getValues()).eql([7]);
		should(v_4.getValues()).eql([5]);
		should(v_5.getValues()).eql([6, 8]);
		should(v_9.getValues()).eql([1]);
		should(v_12.getValues()).eql([1, 2, 3, 4, 5, 6, 7, 8, 9]);
		should(v_14.getValues()).eql([6, 8]);
		should(v_21.getValues()).eql([4]);
		should(v_22.getValues()).eql([3]);
		should(v_41.getValues()).eql([9]);
		should(v_59.getValues()).eql([1]);
		should(v_77.getValues()).eql([2]);
		
		should(v_12.setValue(6)).eql(false);
		
		should(v_3.getValues()).eql([7]);
		should(v_4.getValues()).eql([5]);
		should(v_5.getValues()).eql([6, 8]);
		should(v_9.getValues()).eql([1]);
		should(v_12.getValues()).eql([1, 2, 3, 4, 5, 6, 7, 8, 9]);
		should(v_14.getValues()).eql([6, 8]);
		should(v_21.getValues()).eql([4]);
		should(v_22.getValues()).eql([3]);
		should(v_41.getValues()).eql([9]);
		should(v_59.getValues()).eql([1]);
		should(v_77.getValues()).eql([2]);
	});
	*/
	
	it("should f_0 commit", function() {
		var f_0 = new VariableFactory();
		var v_71 = f_0.v({domain:[1,2,3,4,5,6,7,8,9], });
		var v_80 = f_0.v({domain:[1,2,3,4,5,6,7,8,9], });
		should(v_71.notUnify(v_80)).eql(true);
		should(v_71.notUnify(v_80)).eql(true);
		/*
			invalid version number < 0
			f_0 commit
		*/
		console.log("user commit");
		console.log(f_0.getVersion());
		should(f_0.commit()).eql(0);
	});

});

