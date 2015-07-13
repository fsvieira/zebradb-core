function variable (name) {
	if (!name || (name.length===0)) {
		return { 
			type: "variable"
		};
	}

	return {
		type: "variable",
		name: name
	};
}

function not (p) {
	var v = variable();
	v.notEquals = [p];
	return v;
}

function constant (value) {
	return {
		type: "constant",
		value: value
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
		tuple: t
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

