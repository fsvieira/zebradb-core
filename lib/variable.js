function cloneShare (share) {
	return {
		domain: share.domain.slice(0),
		except: share.except.slice(0),
		equal: share.equal.slice(0),
		notEqual: share.notEqual.slice(0),
		init: share.init,
		updated: share.updated // assume that this will be saved...
	};
};


// TODO: save and revert on fail.
function Variable (options, factory) {
	
	var self = this;
	
	// Events
	var valueEvents = [];
	var domainEvents = [];

	this.share = {
		equal: [self],
		notEqual: [],
		domain: [],
		except: [], // TODO: except as init flag, if except = undefined init = true, else false.
		init: false,
		updated: false
	};

	// -- function for factory, should be revised, 
	this.isUpdate = function () {
		return self.share.updated;
	};
	
	this.update = function () {
		this.share.updated = true;
	};

	if (options && options.domain) {
		options.domain.forEach (function (v) {
			if (self.share.domain.indexOf(v) === -1) {
				self.share.domain.push(v);
			}
		});
		
		self.share.init = self.share.domain.length > 0;
	};

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
			setNoValue(vars[i], value);
		}
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
			propagateNoValue(v, v.getValue());
		}
		
		for (var i=0; i<v.share.equal.length; i++) {
			var eq = v.share.equal[i];
			if (!(eq.fireOnDomain() && (fValue && eq.fireOnValue()))) {
				return false;
			}
		}

		return true;
	};

	// -- TODO: make this a external operation, keep it as not oficial until figure out a better way to make this.
	// -- or just use backtrack insted...
	this.tryValues = function (stop, noSave) {
		stop = stop || [];
		if (stop.indexOf(self) === -1) {
			stop.push(self);
			if (self.getValues().length > 0) {
				var values = [];
				var novalues = [];

				var version = factory.commit(true);

				self.getValues().forEach (function (value) {
					var ok = true;
					if (self.setValue(value)) {
						self.share.notEqual.forEach (function (no) {
							ok = ok && no.tryValues(stop, true);
						});
					}
					
					factory.reset(version);

					if (ok) {
						values.push(value);
					}
					else {
						novalues.push(value);
					}
				});

				factory.remove(version);

				if (!noSave) {
					novalues.forEach(function (value) {
						self.setNoValue(value);
					});
				}

				return (values.length > 0);
			}
		}
		return true;
	}

};

function VariableFactory() {
	var vars  = [];
	var stack = []; 
	var self = this;
	
	// -- Version: --
	var versions = [];
	
	this.commit = function (force) {
		var shares = [];
		var count = 0;
		
		for (var i=0; i<vars.length; i++) {
			var v = vars[i];

			if (!v.isUpdate()) {
				v.update();
				count++;
				v.share.clone = undefined;
			}

			if (!v.share.clone) {
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
		version = (version===undefined)?(versions.length-1):version;
		
		if (version < versions.length) {
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
		versions.length = version;
	};
	
	this.getVersion = function () {
		return versions.length-1;
	};
	
	// ----
	
	this.v = function (options) {
		var v = new Variable(options, self);
		vars.push(v);
		return v;
	};
	
	this.hold = function () {
		var ok = true;
		vars.forEach (function (v) {
			ok = ok && v.hold();
		});
		
		return ok;
	}
	
	this.getVars = function () {
		return vars.slice(0);
	}
	
	this.tryValues = function () {
		vars.sort(function (a, b) {
			return b.getValues().length < a.getValues().length;
		});
		
		vars.forEach (function (v) {
			v.tryValues();
		});
	}
}

module.exports  = VariableFactory;

