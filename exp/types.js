function variable (name) {
	return {
		type: "variable",
		name: name || ""
	};
}

function constant (value) {
	return {
		type: "constant",
		value: value
	};
}

function tuple (ts) {
	return {
		type: "tuple",
		tuple: ts
	};
}


module.exports = {
	variable: variable,
	constant: constant,
	tuple: tuple,
	v: variable,
	c: constant,
	t: tuple
};

