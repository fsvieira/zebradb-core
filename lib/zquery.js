var Z = require("./z");
var should = require("should");

/* TODO: singletone constant ?? */
function Constant (value) {
    this.value = value;
}

function Variable (name, context) {
    this.context = context; 
    this.name = name;
    this.share = {
        equals: [this],
        notEquals: [],
        update: true
    };
}

function Tuple (tuple, context) {
    this.tuple = tuple;
    this.context = context;
}

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
	var value = this.getValue();
	var s =  "'" + this.name;
	
	if (value !== undefined) {
		s += " = " + value.toString();
	}
	
	return s;
};


/* Get Value */
/* Get Value Constant */
Constant.prototype.getValue = function () {
	return this.value;
};

/* Get Value Tuple */
Tuple.prototype.getValue = function () {
	// return this.tuple;
	return this;
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

Constant.prototype._unify = Constant.prototype.unify;

/* Unify Tuple */
Tuple.prototype.unify = function (v) {
	if (v instanceof Tuple) {
		var tupleA = v.tuple;
		var tupleB = this.tuple;
		
		if (tupleA.length === tupleB.length) {
			// v.context.save();
			// this.context.save();
			
			for (var i=0; i<tupleA.length; i++) {
				if (!tupleA[i].unify(tupleB[i])) {
					// v.context.load();
					// this.context.load();
					return false;
				}
			}

			// v.context.keep();
			// this.context.keep();

			return true;
		}
	}
	else if (v instanceof Variable) {
		return v.unify(this);
	}
	
	// Tuple can't unify with anything else.
	return false;
};

Tuple.prototype._unify = Tuple.prototype.unify;

/* Unify Variable */
Variable.prototype.unify = function (v) {
    /* TODO: save and load ?? */
    if (this._unify(v)) {
        /* make all equals share the same share...*/
    	for (var i=0; i<this.share.equals.length; i++) {
    	    var e = this.share.equals[i];
    	    if (e.share) {
    	        e.share = this.share;
    	    }
    	}
    	
    	this.share.update = true;
    	
    	return true;
    }
    
    return false;
};

Variable.prototype._unify = function (v) {
	if (this.share.equals.indexOf(v) === -1) {
		this.share.equals.push(v);
		
		for (var i=0; i<this.share.equals.length; i++) {
			if (!this.share.equals[i]._unify(v)) {
				return false; // unable to unify variable.
			}
		}
			
		for (var i=0; i<this.share.notEquals.length; i++) {
			if (!this.share.notEquals[i]._notUnify(v)) {
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
Constant.prototype._notUnify = Constant.prototype.notUnify;

/* NotUnify Variable */
Variable.prototype.notUnify = function (v) {
    // TODO: save and load ??
    if (this._notUnify(v)) {
        this.share.update = true;
        
        return true;    
    }
    
    return false;
};

Variable.prototype._notUnify = function (v) {
	if (this.share.notEquals.indexOf(v) === -1) {
		this.share.notEquals.push(v);
		
		for (var i=0; i<this.share.equals.length; i++) {
			if (!this.share.equals[i]._notUnify(v)) {
				return false; // unable to not-unify variable.
			}
		}
	}

	return true;
};

Tuple.prototype.notUnify = function (v) {
	if (v instanceof Tuple) {
		var tupleA = v.tuple;
		var tupleB = this.tuple;
		
		// v.context.save();
		// this.context.save();
		
		if (tupleA.length === tupleB.length) {
			for (var i=0; i<tupleA.length; i++) {
				if (tupleA[i].notUnify(tupleB[i])) {
					// success: at least one element is not-unifable,
					// v.context.load();
					// this.context.load();
					return true;
				}
			}
			
			// v.context.load();
			// this.context.load();
			return false;
		}
	}
	else if (v instanceof Variable) {
		return v.notUnify(this);
	}
	
	// Tuple are not-unfiable with anything else.
	return true;
	
};

Tuple.prototype.notUnify = Tuple.prototype._notUnify;


/* Variable clone share */
Variable.prototype.cloneShare = function () {
	if (!this.share._clone || this.share.update) {
		this.share._clone = {
			equals: this.share.equals.slice(0),
			notEquals: this.share.notEquals.slice(0)
		};
		
		this.share.update = false;
	}

	return this.share._clone;
};


/* 
    ===========================
        Context definition,
    ===========================
*/
function create (d, context) {
    switch (d.type) {
        case "variable": 
            var v = context.get(d.name);

            if (d.notEqual) {
                v.notUnify(create(d.notEqual, context));
            }
            
            return v;
        
        case "constant":
            return new Constant(d.value, context);
        
        case "tuple":
            var t = [];
            for (var i=0; i< d.tuple.length; i++) {
                t.push(create(d.tuple[i], context));
            }
            
            return new Tuple(t, context);
    }
    
    throw Error("Unrecongized type " + d.type + ", obj= " + JSON.stringify(d, null, "\t"));
}


function Context () {
	this.variables = {};
	this.allVariables = [];
	
	this.versions = [];
}

Context.prototype.save = function () {
	var versionVars = [];
	var update = false;

	this.allVariables.forEach (function (v) {
	    if (v.share.update) {
		    update = true;
		
    		var share = v.cloneShare();
    		if (versionVars.indexOf(share) === -1) {
    			versionVars.push(share);
    		}
		}
	});

	if (update) {
		this.versions.push(versionVars);
	}
	else if (this.versions.length > 0) {
		this.versions.push(this.versions[this.versions.length-1]);
	}

	return this.versions.length;
};

Context.prototype.load = function () {
	if (this.versions.length > 0) {
		var versionVars = this.versions.pop();
		var update = (this.versions.length === 0) || (versionVars !== this.versions[this.versions.length-1]);
	
		for (var i=0; i<versionVars.length; i++) {
		    var share = versionVars[i];
			share.update = update;
			
			share.equals.forEach(function (equal) {
				equal.share = share;
			});
		}
	}

	return this.versions.length;
};

Context.prototype.keep = function (version) {
    this.versions.pop();
    
    return this.versions.length;
};


Context.prototype.get = function (name) {
	var variable = this.variables[name];

    if (!variable) {
        variable = new Variable(name, this);
        this.allVariables.push(variable);
        
        if (name) {
            this.variables[name] = variable;
        }
    }
    
	return variable;
};


/*
  Run defintion,
*/
function Run (definitions) {
    this.definitions = definitions;
}

Run.prototype._query = function (q, callback) {
	for (var i=0;i < this.definitions.length; i++) {
	   	q.context.save();

        var p = this.definitions[i];
        p = create(p, new Context());

        if (p.unify(q)) {
        	callback(q);
        }

        q.context.load();
    }
};

Run.prototype.query = function (tuple, callback) {
    var q = create(tuple, new Context());

    this._query(q, callback);
};

module.exports = {
    Run: Run,
    Variable: Variable,
    Tuple: Tuple,
    Constant: Constant,
    Context: Context,
    create: create
};
