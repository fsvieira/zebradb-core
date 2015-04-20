/* Constant Declaration */
function Constant (value) {
	
	if (typeof(value) !== "string") {
		throw new Error (
			"Bad Constant Initialization: value must be a string."
		);
	}
	
	this.value = value;
}

/* Tuple Declaration */
function Tuple () {
	var tuple = [];
	
	for (var k in arguments) {
		var t = arguments[k];
		if (
			!(
				(t instanceof Negation) ||
				(t instanceof Constant) ||
				(t instanceof Variable) ||
				(t instanceof Tuple) 
			)
		) {
			throw new Error (
				"Bad Tuple initialization: Array elements must be of type Not, Constant, Variable or Tuple."
			);
		}
			
		tuple.push(t);
	}

	this.tuple = tuple;
}

/* Variable Declaration */
function Variable (name) {
	if ((name !== undefined) && (typeof(name) !== "string")) {
		throw new Error (
			"Bad Variable Initialization: name must be a string or undefined."
		);
	}
	
	this.name = name || "";
}

/* Not Declaration */
function Negation (value) {
	if (value instanceof Negation) {
		/* TODO: Allow double not and solve it on declaration ????*/
		throw new Error (
			"Bad Not initialization: double negation will take no effect."
		);
	}
	if (
		!(
			// (value instanceof Not) || 
			(value instanceof Constant) ||
			(value instanceof Variable) ||
			(value instanceof Tuple) 
		)
	) {
		throw new Error (
			"Bad Not initialization: Array elements must be of type Constant, Variable or Tuple."
		);
	}
	
	this.value = value;
}

/* Definition */
function Definition () {
	var definitions = [];
	for (var k in arguments) {
		var t = arguments[k];
		if (!(t instanceof Tuple)) {
			throw new Error (
				"Bad Definition initialization: only tuples are allowed as declarations elements."
			);
		}
		
		definitions.push(t);
	}

	this.definitions = definitions;
}



/* TODO: Static constructors */
Constant.create = function (value) {
	return new Constant(value);
};

Tuple.create = function () {
	var t = Object.create(Tuple.prototype);
	Tuple.apply(t, arguments);
	return t;
};

Variable.create = function (name) {
	return new Variable(name);
};

/* ToString */
Constant.prototype.toString = function () {
	return this.value;
};

Tuple.prototype.toString = function () {
	var s = "";
	this.tuple.forEach (function (e) {
		if (s !== "") {
			s +=" ";
		}
		s+=	e.toString();
	});
	
	return "(" + s + ")";
};

Variable.prototype.toString = function () {
	return "'" + this.name;
};

Negation.prototype.toString = function () {
	return "!" + this.value.toString();
};

Definition.prototype.toString = function () {
	var s = "";

	this.definitions.forEach(function (tuple) {
		s += tuple.toString() + "\n";
	});
	
	return s;
};

/* Exports */
module.exports  = {
	Variable: Variable,
	Tuple: Tuple,
	Constant: Constant,
	Definition: Definition,
	v: Variable.create,
	t: Tuple.create,
	c: Constant.create
};

