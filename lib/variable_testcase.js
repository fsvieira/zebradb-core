var proxy = require("./proxy");
var Factory = require("./variable_test");

function error (t, name, fn, arguments, err) {
	if (!err.msg) {
		err = {
			error: err,
			msg: err
		};
	};
	console.log("** You found a bug on the lib [https://github.com/fsvieira/zebrajs], please consider to submit this test case, or at least the error message...thanks **\n" + err.error);
	var testcase = proxy.sandbox(err);

	testcase = 'var should = require("should");\n' 
		+ 'var VariableFactory = require("../lib/variable_test_msg");\n\n'
		+ '\ndescribe("Gen Testcase", function() {\n'
		+ '\tit("should '+ err.msg +'", function() {\n'
		+ testcase
		+ '\n\t});\n});\n';

	console.log(testcase);
	
	process.exit(1);
};

Factory.proxy.locals.VariableProxy.proxy.error = error;
Factory.proxy.error = error;

module.exports  = Factory;
