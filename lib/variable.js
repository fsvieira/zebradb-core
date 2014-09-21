/* TODO:
 *  - add events
 * 
 */
function Variable (options) {
	
	/* domain: 
	 *  - undefined: variable can have any value,
	 *  - []: variable doenst exist,
	 *  - [value]: variable as value,
	 *  - [value, ..., value]: variable is undefined but has possible values.
	 */
	
	var self = this;
	options = options || {};

	this.share = {
		// values,
		domain: options.domain,
		except: [],
		// variables,
		equal: [self],
		notEqual: []
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
				if (self.share.notEqual.indexOf(value) === -1) {
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
			
			v.share = self.share;
			
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

};

function v(options) {
	return new Variable(options);
};

exports.v = v;
exports.Variable = Variable;

