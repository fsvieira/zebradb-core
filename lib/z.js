
function not (value) {
	
	var expected = ["variable", "tuple", "constant"];
	if (expected.indexOf(value.type) === -1) {
		throw new Error ("Bad argument: expected " + expected + "!");
	}

	return {
		type: "variable",
		notEqual: value
	};
}

/*
  name: string
*/
function variable (name) {
	if ((name !== undefined) && (typeof(name) !== "string")) {
		throw new Error ("Bad name: expected a string or undefined!");
	}
	
	return {
		type: "variable",
		name: name
	};
}

function tuple () {
	var t = [];
	var expected = ["variable", "tuple", "constant"];
	
	for (var i in arguments) {
		var value = arguments[i];
		
		if (expected.indexOf(value.type) === -1) {
			throw new Error ("Bad argument: expected " + expected + "!");
		}
		
		t.push(value);
	}
	
	return {
		type: "tuple",
		tuple: t
	};
}

// TODO: make constants singletone ?? 
function constant (value) {
	if ((value !== undefined) && (typeof(value) !== "string")) {
		throw new Error ("Bad value argument: expected a string!");
	}
	
	return {
		type: "constant",
		value: value
	};
}

function definition () {
	var d = [];
	var expected = ["variable", "tuple", "constant"];
	for (var i in arguments) {
		var value = arguments[i];
		
		if (expected.indexOf(value.type) === -1) {
			throw new Error ("Bad argument: expected " + expected + "!");
		}
		else if ((value.type === "variable") && (value.name !== undefined)) {
			throw new Error ("Bad argument: only anonymous variables are allowed in definition!");
		}
		
		d.push(value);
	}
	
	return d;
}

/* Exports */
module.exports  = {
	v: variable,
	t: tuple,
	c: constant,
	d: definition,
	n: not
};

