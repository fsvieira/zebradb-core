var types = require("./types");
var operators = require("./operators");

module.exports = {
	variable: types.variable,
	constant: types.constant,
	tuple: types.tuple,
	v: types.variable,
	c: types.constant,
	t: types.tuple,
    n: types.not,
    run: operators.run
};
