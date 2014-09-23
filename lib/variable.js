/* TODO:
 *  - clone share
 *  - add save restore methods:
 *    - saveLoad (vars) { return {save: save(), load: load() };
 * -- Test fire on domain.
 */
function Variable (options) {
	
	/* domain: 
	 *  - undefined: variable can have any value,
	 *  - []: variable doenst exist,
	 *  - [value]: variable as value,
	 *  - [value, ..., value]: variable is undefined but has possible values.
	 */
	
	var self = this;
	var valueEvents = [];
	var domainEvents = [];
	
	options = options || {};

	var domain;
	if (options.domain) {
		// Copy domain and make sure there is no duplicated values,
		domain = [];
		options.domain.forEach (function (value) {
			if (domain.indexOf(value) === -1) {
				domain.push(value);
			}
		});
	}

	this.share = {
		// values,
		domain: domain,
		except: [],
		// variables,
		equal: [self],
		notEqual: [],
		// change,
		change: {
			domainLength: options.domain?options.domain.length:undefined,
		}
	};

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
		valueEvents.forEach (function (fn) {
			fn(self, value);
		});
	};

	this.fireOnDomain = function () {
		var values = self.getValues();
		domainEvents.forEach (function (fn) {
			fn(self, values);
		});
	};

	function fireEvents () {
		if (self.share.domain && (self.share.domainLength !== self.share.domain.length)) { 
			self.share.change.domainLength = self.share.domain.length;
			var fValue = (self.getValue() !== undefined);
			self.share.equal.forEach (function (eq) {
				eq.fireOnDomain (eq);
				if (fValue) {
					eq.fireOnValue (eq);
				}
			});
		}
	};

	this.getValue = function () {
		if (this.share.domain) {
			if (this.share.domain.length === 1) {
				return this.share.domain[0];
			}
		}
		
		return undefined;
	};
	
	this.getValues = function () {
		return this.share.domain || [];
	};

	function checkRef (v) {
		return (
			(self.share.equal.indexOf(v) !== -1) ||
			(self.share.notEqual.indexOf(v) === -1)
		);
	};

	function checkValues (v) {
		var r, f;
		
		// TODO: dont let variables have domain [] ???
		if (
			(self.share.domain && self.share.domain.length === 0)
			|| (v.share.domain && v.share.domain.length === 0)
		) {
			// Cant unify variables that dont exist.
			return false;
		}

		if (!self.share.domain && !v.share.domain){
			return true;
		}
		
		if (self.share.domain && v.share.domain) {
			r = v.getValues().filter(function (value) {
				return (self.getValues().indexOf(value) !== -1);
			});
		}
		else {
			r = self.share.domain || v.share.domain || [];
		}
		
		f = r.filter(function (value) {
			return (
				(self.share.except.indexOf(value) === -1) &&
				(v.share.except.indexOf(value) === -1)
			);
		});
		
		if (f.length === 0) {
			// unification will make variables not existing,
			return false;
		}
		
		return true;
		
	};

	function checkValue () {
		var value = self.getValue();
		if (value !== undefined) {
			self.share.notEqual.forEach (function (novar) {
				// propagate this values to no vars values, 
				novar.setNoValue(value);
			});
		}
		
		fireEvents();
	}

	this.unify = function (v) {
		if (checkRef(v) && checkValues(v)) {
			// merge vars,
			v.share.except.forEach (function (value) {
				if (self.share.except.indexOf(value) === -1) {
					self.share.except.push(value);
				};
			});
			
			if (self.share.domain || v.share.domain) {
				var r;
				if (self.share.domain && v.share.domain) {
					r = v.getValues().filter(function (value) {
						return (self.getValues().indexOf(value) !== -1);
					});
				}
				else {
					r = self.share.domain || v.share.domain || [];
				}
				
				self.share.domain = r.filter (function (value) {
					return (self.share.except.indexOf(value) === -1);
				});
			}

			v.share.equal.forEach (function (equal) {
				if (self.share.equal.indexOf(equal) === -1) {
					self.share.equal.push(equal);
				};
			});
			
			v.share.notEqual.forEach (function (notEqual) {
				if (self.share.notEqual.indexOf(notEqual) === -1) {
					self.share.notEqual.push(notEqual);
				};
			});
			
			self.share.notEqual.forEach (function (novar) {
				if (novar.share.notEqual.indexOf(v) === -1) {
					novar.share.notEqual.push(v);
				}
				
				if (novar.share.notEqual.indexOf(self) === -1) {
					novar.share.notEqual.push(self);
				}
			});
			
			self.share.equal.forEach (function (v) {
				v.share = self.share;
			});
			
			checkValue();
			return true;
		}
		return false;
	};

	this.setValue = function (value) {
		if (
			(!self.share.domain && (self.share.except.indexOf(value) === -1)) ||
			(self.share.domain && self.share.domain.indexOf(value) !== -1)
		) {
			self.share.domain = [value];
			checkValue();
			return true;
		}
		
		return false;
	}

	this.notUnify = function (v) {
		var a = self.getValue();
		var b = v.getValue();
		
		if ( ((a!==undefined) && (a === b)) || self.share.equal.indexOf(v) !== -1) {
			return false;
		}

		if (self.share.notEqual.indexOf(v) === -1) {
			self.share.notEqual.push(v);
		}
		
		if (v.share.notEqual.indexOf(self) === -1) {
			v.share.notEqual.push(self);
		}
		
		if (a !== undefined) {
			v.setNoValue(a);
		}
		
		if (b !== undefined) {
			self.setNoValue(b);
		}
		
		return true;
	};

	this.setNoValue = function (value) {
		if (self.share.except.indexOf(value) === -1) {
			if (self.share.domain && (self.share.domain.indexOf(value) !== -1)) {
				if (self.share.domain.length === 1) {
					return false; // cant set this no value, makes this variable not existing
				}
				else {
					self.share.domain.splice(self.share.domain.indexOf(value), 1);
				}
			}
			self.share.except.push(value);
			checkValue();
			return true;
		}
		
		return false;
	};
	
	this.cloneShare = function () {
		return {
			domain: (self.share.domain?self.share.domain.slice(0):undefined),
			except: self.share.except.slice(0),
			// variables,
			equal: self.share.equal.slice(0),
			notEqual: self.share.notEqual.slice(0),
			// change,
			change: {
				domainLength: self.share.domainLength
			}
		};
	};
	
	this.tryValues = function (sl, stop, noSave) {
		stop = stop || []; 

		if (stop.indexOf(self) === -1) {
			stop.push(self);
			
			var values = [];
			this.getValues().forEach (function (value) {
				if ((self.getValue() === undefined) && self.setValue(value)) {
					var ok = true;
					sl.save();
					for (var i=0; i<self.share.notEqual.length; i++) {
						ok = ok && self.share.notEqual[i].tryValues(sl, stop, true);
						if (!ok) {
							break;
						}
					}
						
					if (ok) {
						values.push(value);
					}
						
					sl.load();
				}
			});
			
			if (!noSave && (values.length > 0)) {
				this.share.domain = values;
			}
			
			return (values.length > 0);
		}
		
		return true;
	};
};

Variable.v = function (options) {
	return new Variable(options);
}

Variable.saveAndLoad = function (vars) {
	var stack = [];
	return {
		save: function () {
			var check = [];
			var shares = [];
			vars.forEach (function (v) {
				if (check.indexOf(v.share) === -1) {
					check.push(v.share);
					shares.push(v.cloneShare());
				}
			});
			
			stack.push(shares);
		},
		load: function () {
			var s = stack.pop();
			if (s) {
				s.forEach (function (share) {
					share.equal.forEach (function (eq) {
						eq.share = share;
					});
				});
			}
		}
	};
};

 module.exports  = Variable;

