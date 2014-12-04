var proxy = require("./proxy");
var Factory = require("./variable_test");

function error (t, name, fn, arguments, err) {
	console.log("** You found a bug on the lib [https://github.com/fsvieira/zebrajs], If you want to submit a bug report please run it with variables_testcase **\n" + err.error + "\n" + err.msg);
	process.exit(1);
};

Factory.proxy.locals.VariableProxy.proxy.error = error;
Factory.proxy.error = error;

module.exports  = Factory;
