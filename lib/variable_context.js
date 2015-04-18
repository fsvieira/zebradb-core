var M = require("variable");

/* ====================================== */
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

// TODO: should get constant, tuple, variable...
Context.prototype.get = function (v) {
	var variable;
	if (v.name) {
		variable = new ContextVariable(null, this); // create new anonymous variables,
	}
	else {
		variable = this.variables[v.name];
		
		if (!variable) {
			variable = new ContextVariable(v.name, this);
		}
	}
	
	return variable;
};

// ---------------------------

function ContextConstant (constant, context) {
	this.constant = constant;
	this.context = context || new Context();
}

/* Tuple Def */
function ContextTuple (tuple, context) {
	this.tuple = tuple;
	this.context = context || new Context();
}

/* Variable Def */
function ContextVariable (variable, context) {
	this.variable = variable;
	this.share = {
		equals: [this],
		notEquals: []
	};

	this.context = context || new Context();
}


/* ToString */
Constant.prototype.toString = function () {
	return this.value;
};

DeclTuple.prototype.toString = function () {
	var s = "";
	this.tuple.forEach (function (e) {
		if (s !== "") {
			s +=" ";
		}
		s+=	e.toString();
	});
	
	return "(" + s + ")";
};

DeclVariable.prototype.toString = function () {
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

/* Error messages */
/* TODO: Change type names of Variable and Tuples for better error messages. */

function throwContextException (v, action) {
	if (v instanceof DeclVariable) {
		throw new Error("Variable Declarations can't be " + action + ", please use .context() to get a context variable.");
	}
	else if (v instanceof DeclTuple) {
		throw new Error("Tuple Declarations can't be " + action + ", please use .context() to get a context tuple.");
	}
	else {
		throw new Error("Bad Obect type, please use: Constant, Variable or Tuple.");
	}
}

/* Unify */
/* Unify Constant */
Constant.prototype.unify = function (v) {
	if (v instanceof Constant) {
		return this.getValue() === v.getValue();
	}
	else if (v instanceof Variable) {
		return v.unify(this);
	}
	else if (v instanceof Tuple) {
		// A constant cant be unifyed with anything else...
		return false;
	}

	throwContextException(v, "unified");

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
		var tupleA = v.getValue();
		var tupleB = this.getValue();
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
		return v.notUnify(this);
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

module.exports  = {
	Variable: DeclVariable,
	Tuple: DeclTuple,
	Constant: Constant
};

