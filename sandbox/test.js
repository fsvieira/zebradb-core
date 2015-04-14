/* Constant Def */
function Constant (value) {
	this.value = value;
}

/* Tuple Def */
function Tuple (tuple, context) {
	this.tuple = tuple;
	this.context = context;
}

/* Variable Def */
function Variable (name, context) {
	this.name = name;
	this.share = {
		equals: [this],
		notEquals: []
	};

	this.context = context;
}

/* Context Def */ 
function Context () {
	this.variables = {};
	this.versions = [];
}

Context.prototype.commit = function () {
	/* TODO: save share, not vars */
	
	var versionVars = [];
	var update = false;
	for (var id in this.variables) {
		var v = this.variables[id];
		update = update || v.share.update;
		
		if (versionVars.indexOf(v.cloneShare()) !== -1) {
			versionVars.push(v.cloneShare());
		}
	}
	
	
	if (update) {
		this.versions.push(versionVars);
	}
	
	return this.versions.length - 1;
};

Context.prototype.revert = function (version) {
	version = version || this.versions.length - 1;
	
	if (version < this.versions.length) {
		var versionVars = this.versions[version];
		this.versions.length = version;
		
		for (var share in versionVars) {
			share.equals.forEach(function (equal) {
				equal.share = share;
			});
		}
		
	}
};

Context.prototype.get = function (v) {
	var variable;
	if (v.name) {
		variable = new Variable(); // create new anonymous variables,
	}
	else {
		variable = this.variables[v.name];
		
		if (!variable) {
			variable = new Variable(v.name, this);
		}
	}
	
	return variable;
};

/* TODO: make this function internal, always make a clone if object as no context 
   (except for constants that cant be changed.)
*/
Constant.prototype.clone = function () {
	return this;
};

Tuple.prototype.clone = function (context) {
	if (this.context) {
		return this;
	}
	else {
		var tuple = [];
		
		context = context || new Context();
		for (var i=0;i<this.tuple.length; i++) {
			tuple.push(this.tuple[i].clone(context));
		}
		
		return new Tuple(tuple, context);
	}
};

Variable.prototype.clone = function (context) {
	if (this.context) {
		return this;
	}
	else {
		context = context || new Context();
		return context.get(this);
	}
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


/* Get Value */
/* Get Value Constant */
Constant.prototype.getValue = function () {
	return this.value;
};

/* Get Value Tuple */
Tuple.prototype.getValue = function () {
	return this.tuple;
};

/* Get Value Tuple */
Variable.prototype.getValue = function (stop) {
	stop = stop || [];
	if (stop.indexOf(this) === -1) {
		stop.push(this);
		for (var i=0; i<this.share.equals.length; i++) {
			var value = this.share.equals[i].getValue(stop);
			if (value !== undefined) {
				return value;
			}
		}
	}
};



/* Unify */
/* Unify Constant */
Constant.prototype.unify = function (v) {
	if (v instanceof Constant) {
		return this.getValue() === v.getValue();
	}
	else if (v instanceof Variable) {
		return v.unify(this);
	}
	
	// A constant cant be unifyed with anything else...
	return false;
};

/* Unify Tuple */
Tuple.prototype.unify = function (v) {
	if (v instanceof Tuple) {
		var tupleA = v.clone().getValue();
		var tupleB = this.clone().getValue();
		
		var versionA = tupleA.context.commit();
		var versionB = tupleB.context.commit();
		
		if (tupleA.length === tupleB.length) {
			for (var i=0; i<tupleA.length; i++) {
				if (!tupleA[i].unify(tupleB[i])) {
					tupleA.context.revert(versionA);
					tupleB.context.revert(versionB);
					return false;
				}
			}

			tupleA.context.remove(versionA);
			tupleB.context.remove(versionB);


			return true;
		}

		tupleA.context.revert(versionA);
		tupleB.context.revert(versionB);

	}
	else if (v instanceof Variable) {
		return v.clone().unify(this);
	}
	
	// Tuple can't unify with anything else.
	return false;
};

/* Unify Variable */
Variable.prototype.unify = function (v) {
	/* TODO: revert changes in case of fail, probably on tuples... */
	if (this.share.equals.indexOf(v) === -1) {
		this.share.equals.push(v);
		
		for (var i=0; i<this.share.equals.length; i++) {
			if (!this.share.equals[i].unify(v)) {
				return false; // unable to unify variable.
			}
		}
			
		for (var i=0; i<this.share.notEquals.length; i++) {
			if (!this.share.notEquals[i].notUnify(v)) {
				return false; // unable to not-unify variable.
			}
		}
	}

	return true;
};

/* NotUnify */
/* NotUnify Constant */
Constant.prototype.notUnify = function (v) {
	if (v instanceof Constant) {
		return this.getValue() !== v.getValue();
	}
	else if (v instanceof Variable) {
		return v.notUnify(this);
	}
	
	// Anything else is not-unifable with constant.
	return true;
};

/* TODO: NotUnify Tuple */

/* NotUnify Variable */
Variable.prototype.notUnify = function (v) {
	/* TODO: revert changes in case of fail, probably on tuples... or use context to do it. */
	if (this.share.notEquals.indexOf(v) === -1) {
		this.share.notEquals.push(v);
		
		for (var i=0; i<this.share.equals.length; i++) {
			if (!this.share.equals[i].notUnify(v)) {
				return false; // unable to not-unify variable.
			}
		}
	}

	return true;
};

Tuple.prototype.notUnify = function (v) {
	if (v instanceof Tuple) {
		/* TODO: revert all changes even on success */
		var tupleA = v.clone().getValue();
		var tupleB = this.clone().getValue();
		if (tupleA.length === tupleB.length) {
			for (var i=0; i<tupleA.length; i++) {
				if (tupleA[i].notUnify(tupleB[i])) {
					// success: at least one element is not-unifable,
					return true;
				}
			}
			return false;
		}
	}
	else if (v instanceof Variable) {
		return v.clone().notUnify(this);
	}
	
	// Tuple are not-unfiable with anything else.
	return true;
	
};

/* Variable clone share */
Variable.prototype.cloneShare = function () {
	if (!this.share._clone || this.share.update) {
		this.share._clone = {
			equals: this.share.equals.slice(0),
			notEquals: this.share.notEquals.slice(0),
		};
		
		this.share.update = false;
	}
	
	return this.share._clone;
};


/* Tests */
var nats = [
	new Tuple([new Constant("nat"), new Constant("0")]),
	new Tuple([new Constant("nat"), new Tuple([new Constant("nat"), new Variable("X")])]),
];

console.log(nats[0].toString());
console.log(nats[1].toString());

/* Unify Constant Tests */
console.log("/* Unify Constant Tests */");
var yellow = new Constant("Yellow");
var yellow2 = new Constant("Yellow");
var blue = new Constant("Blue");

console.log(yellow.unify(yellow));

console.log(yellow2.unify(yellow));
console.log(yellow.unify(yellow2));

console.log(blue.unify(yellow));
console.log(yellow.unify(blue));

/* Unify Constant/Variables Tests */
console.log("/* Unify Constant/Variables Tests */");
var a = new Variable("A");
console.log(a.unify(yellow));
console.log(a.unify(blue));

/* Unify Tuples Tests */
console.log("/* Unify Tuples Tests */");
var tA = new Tuple([yellow, blue]);
var tB = new Tuple([new Variable("X"), new Variable("Y")]);

console.log(tA.unify(tB));

/* Unify Get Value Tests */
console.log("/* Unify Get Value Tests */");
console.log(yellow.getValue());
console.log(blue.getValue());

console.log(a.getValue());
