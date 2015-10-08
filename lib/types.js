function variable (name) {
	if (!name || (name.length===0)) {
		return { 
			type: "variable"
		};
	}

	return {
		type: "variable",
		data: name
	};
}

function not (p) {
	return {
		type: "not",
		data: p
	};
}

function constant (value) {
	return {
		type: "constant",
		data: value
	};
}

function tuple (ts) {

	var t;
	if (ts instanceof Array) {
		t = ts;
	}
	else {
		t = [];
		for (var i in arguments) {
			var value = arguments[i];
			t.push(value);
		}
	}
	
	return {
		type: "tuple",
		data: t
	};
}


module.exports = {
	variable: variable,
	constant: constant,
	tuple: tuple,
	not: not,
	v: variable,
	c: constant,
	t: tuple,
	n: not
};

