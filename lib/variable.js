function cloneShare (share) {
	return {
		domain: share.domain.slice(0),
		except: share.except.slice(0),
		equal: share.equal.slice(0),
		notEqual: share.notEqual.slice(0),
		init: share.init,
		updated: share.updated
	};
};


/* Constant Def */
function Constant (value) {
	this.value = value;
};

/* Tuple Def */
function Tuple (value) {
	this.value = value;
};

/* Variable Def */
function Variable (name) {
	this.name = name;
};

/* Context Def */
function Context () {
	var variables = {};
};



// ===  Unify ===
// - Unify Constant,
Constant.prototype.unify = function (v) {
	if (v instanceof Constant) {
		return this.getValue() === v.getValue();
	}
	else if (v instanceof Variable) {
		return v.unify(this);
	}
	
	// A constant cant be unifyed with anything else...
	return false;
}

// - Unify Tuple,
Tuple.prototype.unify = function (v) {
	if (v instanceof Tuple) {
		var tupleA = v.getValue();
		var tupleB = this.getValue();
		if (tupleA.length === tupleB.length) {
			/* TODO: 
				- recursiva danger??
				- provide a way to revert in case of fail!!
			*/
			for (var i=0; i<tupleA.length; i++) {
				if (!tupleA[i].unify(tupleB[i])) {
					return false;
				}
			}
		}
	}
	else if (v instanceof Variable) {
		return v.unify(this);
	}
	
	// Tuple can't unify with anything else.
	return false;
}

// - Unify Variable,
// TODO: ...

Constant.prototype.notUnify = function (v) {
	if (v instanceof Constant) {
		return this.getValue() !== v.getValue();
	}
	else if (v instanceof Variable) {
		return v.notUnify(this);
	}
	
	// Constant can't unify with anything else.
	return true; 
}

Constant.prototype.getValue = function (v) {
	return this.value;
}







Tuple.prototype.notUnify = function (v) {
	// For now lets consider that tuples are not-unifiable.
	return false;
	
	if (v instanceof Tuple) {
		var tupleA = v.getValue();
		var tupleB = this.getValue();
		if (tupleA.length === tupleB.length) {
			/* TODO: 
				- recursive danger??
				- provide a way to revert in case of fail!!
				- should tuples be able to notUnify??
				- should a tuple notUnify total or parcial??
			*/
			for (var i=0; i<tupleA.length; i++) {
				if (tupleA[i].notUnify(tupleB[i])) {
					return false;
				}
			}
			
		}
	}
	else if (v instanceof Variable) {
		return v.notUnify(this);
	}
	
	// anything else is not unifyable with a constant ...
	return true; 
}

Tuple.prototype.getValue = function (v) {
	return this.value;
}


/* TODO [variables]: 
	- Unify variable with constant/tuple/variable,
	- NotUnify variable with constant/variable.
*/

/* Variable */

// TODO: save and revert on fail.
function Variable (name) {
	this.name = name;

	/*this.share = {
		equal: [this],
		notEqual: []
	};*/
}

Variable.prototype.unify = function (v) {
	
	if (v instanceof Variable) {
				
	}
	
	var value = this.getValue();
	if (value === undefined) {
		
	}
	
	
	

}

	// Conditions:
	function findEqual (vars, v) {
		for (var i=0; i<vars.length; i++) {
			if (vars[i].share.equal.indexOf(v) !== -1) {
				return true;
			}
		}
		return false;
	};
		
	/**
	 * Check if variable a and b can be unified by reference.
	 */
	function checkRefEqual (a, b) {
		return (
			(a.share === b.share)
			|| ( 
				(b.share.notEqual.indexOf(a) === -1) && (a.share.notEqual.indexOf(b) === -1)
				&& !findEqual(a.share.notEqual, b)	&& !findEqual(b.share.notEqual, a)
			)
		);
	};

	/**
	 * Check if variable a and b can be not unified by reference.
	 */
	function checkRefNotEqual (a, b) {
		return (
			(a.share !== b.share)
			&& (a.share.equal.indexOf(b) === -1)
			&& (b.share.equal.indexOf(a) === -1)
		);
	};

	/*
	 * This functions assume that except and domain are always updated.
	 */
	/**
	 * Check if value can be set on this variable.
	 */
	function checkValue (v, value) {
		return (
			(v.share.except.indexOf(value) === -1) 
			&& (!v.share.init || (v.share.domain.indexOf(value) !== -1))
		);
	};

	/**
	 * Check if not value can be set on this variable.
	 */
	function checkNoValue (v, value) {
		return ((v.share.domain.length > 1) || (v.share.domain.indexOf(value) === -1));
	}

	/**
	 * set a variable value,
	 */
	function propagateNoValue (v, value) {
		var vars = v.share.notEqual;
		for (var i=0; i<vars.length; i++) {
			if (!setNoValue(vars[i], value)) {
				return false;
			}
		}
		
		return true;
	}; 

	/**
	 * set a variable value,
	 */
	function setValue (v, value) {
		if (checkValue(v, value)) {
			v.share.init = true;

			if (v.share.domain.length !== 1) {
				v.share.domain = [value];
				v.share.updated = false;

				// Domain changed...(value)
				return fireEvents(v);
			}
			
			return true;
		}

		return false;		
	};
	
	/**
	 * set a variable except value,
	 */
	function setNoValue (v, value) {
		if (checkNoValue(v, value)) {
			if (v.share.except.indexOf(value) === -1) {
				v.share.updated = false;

				var i = v.share.domain.indexOf(value);
				
				v.share.except.push(value);
				
				if (i !== -1) {
					v.share.domain.splice(i, 1);

					// Domain changed, ...
					return fireEvents(v);
				}
			}
			
			return true;
		}
		
		return false;
	};
	
	/**
	 * Unify two variables,
	 */
	function unify (a, b) {
		if (checkRefEqual(a, b)) {
			// Check a, b values...
			if (a.share !== b.share) {
				var al = a.share.domain.length;
				var bl = b.share.domain.length;
				
				if ((a.share.init === true) || (b.share.init === true)) {
					var ra, rb, r;
					
					if (a.share.init) {
						ra = a.share.domain.filter(function (value) {
							return checkValue(b, value);
						});
					}
					
					if (b.share.init) {
						rb = b.share.domain.filter(function (value) {
							return checkValue(a, value);
						});
					}
					
					if (ra && rb) {
						r = ra.filter(function (value) {
							return (rb.indexOf(value) !== -1);
						});
					}
					else if (ra) {
						r = ra;
					}
					else if (rb) {
						r = rb;
					}
					
					if (r.length === 0) {
						return false;
					}
					
					a.share.init = true;
					a.share.domain = r;
				}
				
				a.share.updated = false;
				
				// merge vars
				b.share.except.forEach(function (v) {
					if (a.share.except.indexOf(v) === -1) {
						a.share.except.push(v);
					}
				});
				
				b.share.equal.forEach(function (v) {
					v.share = a.share;
					if (a.share.equal.indexOf(v) === -1) {
						a.share.equal.push(v);
					}
				});
				
				b.share.notEqual.forEach(function (v) {
					if (a.share.notEqual.indexOf(v) === -1) {
						a.share.notEqual.push(v);
					}
				});
				
				b.share = a.share;
				
				if ((al !== a.share.domain.length) || (bl !== a.share.domain.length)) {
					// Domain changed for at least one of the variables, ...
					return fireEvents(a);
				}
				
			}

			return true;
		}
		
		return false;
	};

	/**
	 * NotUnify two variables,
	 */
	function notUnify (a, b) {
		if (checkRefNotEqual(a, b)) {
			if (a.share.notEqual.indexOf(b) === -1) {
				if ((a.share.domain.length===1)
					 && (b.share.domain.length===1)
					 && (b.share.domain[0] === a.share.domain[0])
				) {
					return false;
				}
				
				a.share.updated = false;
				b.share.updated = false;

				a.share.notEqual.push(b);
				b.share.notEqual.push(a);
				
				if (a.share.domain.length === 1) {
					b.setNoValue(a.share.domain[0]);
				}
				
				if (b.share.domain.length === 1) {
					a.setNoValue(b.share.domain[0]);
				}
			}
			
			return true;
		}
		return false;
	};

	function enter () {
		return factory.commit(true);
	};

	function leave (ok, version) {
		if (!ok) {
			factory.reset(version);
		}
		
		factory.remove(version);
		
		return ok;
	};

	// export functions,	
	this.setValue = function (value) {
		var version = enter();
		return leave(setValue(self, value), version);
	};

	this.setNoValue = function (value) {
		var version = enter();
		return leave(setNoValue(self, value), version);
	};

	this.unify = function (v) {
		var version = enter();
		return leave(unify(self, v), version);
	};

	this.notUnify = function (v) {
		var version = enter();
		return leave(notUnify(self, v), version);
	};

	this.getValue = function () {
		if (self.share.domain.length === 1) {
			return self.share.domain[0];
		}
		
		return undefined;
	};

	this.getValues = function () {
		// return self.share.domain.slice(0);
		return self.share.domain; // read only value...
	}


	// Events
	// TODO: make events return a ok code, if false revert everyting :P
	this.onvalue = function (fn) {
		if (valueEvents.indexOf(fn) === -1) {
			valueEvents.push(fn);
		}
	};

	this.ondomain = function (fn) {
		if (domainEvents.indexOf(fn) === -1) {
			domainEvents.push(fn);
		}
	};

	this.fireOnValue = function () {
		var value = self.getValue();

		for (var i=0; i<valueEvents.length; i++) {
			var fn = valueEvents[i];
			if (!fn(self,value)) {
				return false;
			}
		}

		return true;
	};

	this.fireOnDomain = function () {
		var values = self.getValues();
		for (var i=0; i<domainEvents.length; i++) {
			var fn = domainEvents[i];
			if (!fn(self,values)) {
				return false;
			}
		}

		return true;
	};

	function fireEvents (v) {
		var fValue = (v.getValue() !== undefined);
		
		if (fValue) {
			// Propagate as no value, before starting to fire events.

			if (!propagateNoValue(v, v.getValue())) {
				return false;
			}
		}
		
		for (var i=0; i<v.share.equal.length; i++) {
			var eq = v.share.equal[i];
			if (eq.fireOnDomain()) {
				if (fValue) {
					if (!eq.fireOnValue()) {
						return false;
					}
				}
			}
			else {
				return false;
			}
		}

		return true;
	};
};


function VariableFactory() {
	var vars  = [];
	// var stack = []; 
	var self = this;
	var versions = [];
	
	this.V = Variable;
	
	this.commit = function (force) {
		var shares = [];
		var count = 0;
		
		for (var i=0; i<vars.length; i++) {
			var v = vars[i];

			if (!v.isUpdate()) {
				// clone everything,
				v.share.clone = cloneShare(v.share);
				v.update();
				count++;
			}
			else if(!v.share.clone) {
				count++;
				v.share.clone = cloneShare(v.share);
			} 

			if (shares.indexOf(v.share.clone) === -1) {
				shares.push(v.share.clone);
			}
		}

		if (force || count) {
			versions.push(shares);
		}
		
		return versions.length-1;
	};

	this.reset = function (version) {
		if (versions.length === 0) {return};
		
		if ((version >=0) && version < versions.length) {
			var _vars = [];
			var _version = versions[version];
			
			_version.forEach (function (share) {
				var _share = cloneShare (share);
				_share.clone = share;
				share.equal.forEach (function (eq) {
					eq.share = _share;
					eq.update();
					if (_vars.indexOf(eq) === -1) {
						_vars.push(eq);
					}
				});
			});

			versions.length = version + 1;
			vars = _vars; // keep only version variables, all variables out of this version will be invalid.
		}
		
		return versions.length-1;
	};
	
	this.rebase = function (version) {
		if (version < versions.length) {
			var v = versions.length-1;

			versions[version] = versions[v];
			versions.length = version + 1;
			self.reset();
			return v;
		}
		
		return versions.length-1;
	};
	
	this.remove = function (version) {
		if (versions.length > version) {
			versions.length = version;
			// TODO: only set variables that where changed,
			vars.forEach (function (v) {
				v.share.updated = false;
			});
		}
	};
	
	this.getVersion = function () {
		return versions.length-1;
	};
	
	this.v = function (options) {
		var v = new self.V(options, self);
		vars.push(v);
		return v;
	};
	
	this.getVars = function () {
		return vars.slice(0);
	};
	
}

VariableFactory.Variable = Variable;

module.exports  = VariableFactory;

