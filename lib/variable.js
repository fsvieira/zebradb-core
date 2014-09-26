function Variable (options, factory) {
	
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

	// ---
	function check () {
		if (self.share.domain) {
			self.share.domain = self.share.domain.filter (function (value) {
				return (self.share.except.indexOf(value) === -1);
			});
		}
		
		var ok = true;
		self.share.equal.forEach (function (eq) {
			self.share.notEqual.forEach (function (no) {
				ok = ok && no.notUnify(eq);
			});		
		});
		
		var value = self.getValue();
		if (ok && (value !== undefined)) {
			self.share.notEqual.forEach (function (no) {
				ok = ok && no.setNoValue(value);
			});
		}
		
		if (ok) {
			self.share.notEqual.forEach (function (no) {
				var value = no.getValue();
				if (value !== undefined) {
					ok = ok && self.setNoValue(value);
				}
			});
		}

		if (ok) {
			self.share.equal.forEach (function (eq) {
				ok = ok && (self.share.notEqual.indexOf(eq) === -1);
			});
		}
		
		ok = ok && self.hold();

		fireEvents();
		
		return ok;
	};
	
	function enter () {
		factory.save();
	}
	
	function leave () {
		var ok = check() && factory.hold();

		if (ok) {
			factory.pop();
		} else {
			factory.load();
			return false;
		}
		
		return true;
	}
	
	this.hold = function () {
		return (this.share.domain===undefined) || (this.share.domain.length !== 0);
	};

	this.getValue = function () {
		if (this.share.domain && (this.share.domain.length === 1)) {
			return this.share.domain[0];
		}
		
		return undefined;
	};
	
	this.getValues = function () {
		return this.share.domain || [];
	};

	
	this.unify = function (v) {
		if (this.share.equal.indexOf(v) === -1) {
			enter();

			this.share.equal.push (v);
			
			v.share.except.forEach (function (value) {
				if (self.share.except.indexOf(value) === -1) {
					self.share.except.push(value);
				}
			});
			
			if (self.share.domain && v.share.domain) {
				self.share.domain = self.share.domain.filter (function (value) {
					return (v.share.domain.indexOf(value) !== -1);
				});
			}
			else {
				self.share.domain = self.share.domain || v.share.domain;
			}
			
			v.share.notEqual.forEach (function (no) {
				if (self.share.notEqual.indexOf(no) === -1) {
					self.share.notEqual.push(no);
				}
			});
			
			v.share = self.share;
			
			return leave();
		}
		
		return true;
	};
	
	this.notUnify = function (v) {
		if (this.share.notEqual.indexOf(v) === -1) {
			enter();
			this.share.notEqual.push(v);
			return leave();
		}
		
		return true;
	};
	
	this.setValue = function (value) {
		if ((this.share.domain === undefined) || (this.share.domain.indexOf(value) !== -1)) {
			enter();
			this.share.domain = [value];
			return leave();
		}
		
		return false;
	};
	
	this.setNoValue = function (value) {
		if (self.share.except.indexOf(value) === -1) {
			enter();
			self.share.except.push(value);
			
			return leave();
		}
		return true;
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

	this.tryValues = function (stop, noSave) {
		stop = stop || [];
		
		if (stop.indexOf(self) === -1) {
			stop.push(self);
			if (self.getValues().length > 0) {
				var values = [];
				var novalues = [];
				self.getValues().forEach (function (value) {
					factory.save();
					var ok = true;
					if (self.setValue(value)) {
						self.share.notEqual.forEach (function (no) {
							ok = ok && no.tryValues(stop, true);
						});
					}
					factory.load();
					
					if (ok) {
						values.push(value);
					}
					else {
						novalues.push(value);
					}
				});
				
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
	
	this.v = function (options) {
		var v = new Variable(options, self);
		vars.push(v);
		return v;
	};
	
	this.save = function () {
		var check = [];
		var shares = [];
		vars.forEach (function (v) {
			if (check.indexOf(v.share) === -1) {
				check.push(v.share);
				shares.push(v.cloneShare());
			}
		});
			
		stack.push(shares);	
	};
	
	this.pop = function () {
		stack.pop();
	};
	
	this.load = function () {
		var s = stack.pop();
		if (s) {
			s.forEach (function (share) {
				share.equal.forEach (function (eq) {
					eq.share = share;
				});
			});
		}
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

