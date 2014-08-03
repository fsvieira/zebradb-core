function Variable (options) {
	
	var self = this;
	var domain = options?options.domain:undefined;
	var fn_change = [];
	
	this.share = {
		equal: [self],
		not_equal: [],
		value: {
			value: undefined,
			vars: [] // vars contributing to this value.
		},
		no_values: {
			/* value: [no value vars], */
		},
		domain: {
			/* intersect of domain on equal values */
		} 
	};
	
	this.change = function (f) {
		if (fn_change.indexOf(f) === -1) {
			fn_change.push(f);
		}
	};
	
	this.trigger_change = function () {
		fn_change.forEach (function (f) {
			f(self);
		});
	};
	
	function runChange () {
		// trigger change to all vars,
		self.share.equal.forEach (function (v) {
			v.trigger_change();
		});
	};
	
	/*
	 * 
	 */
	this.cloneShare = function () {
		var r = {
			equal: this.share.equal.slice(0),
			not_equal: this.share.not_equal.slice(0),
			value: {
				value: this.share.value.value,
				vars:  this.share.value.vars.slice(0) // vars contributing to this value.
			},
			no_values: {
				/* value: [no value vars], */
			},
			domain: {
				/* intersect of domain on equal values */
			}
		};
		
		// copy no values:
		for (var i in this.share.no_values) {
			r.no_values[i] = this.share.no_values[i].slice(0);
		}

		for (var i in this.share.domain) {
			r.domain[i] = this.share.domain[i].slice(0);
		}
		
		return r;
	};
	
	/*
	 * get value
	 */
	this.getValue = function () {
		return this.share.value.value;
	};

	this.getValues = function () {
		if (this.getValue() !== undefined) {
			return [this.getValue()];
		}

		var l = this.share.equal.length;
		var values = [];

		for (var i in this.share.domain) {
			if (this.share.domain[i].length === l) {
				values.push(+i);
			}
		}
		
		// remove all no_values,
		for (var i in this.share.no_values) {
			var index = values.indexOf(+i);
			if (index !==-1) {
				values.splice(index, 1);
			}
		}
		
		return values;
	};
	
	this.tryValues = function (stop, top) {
		stop = stop || [];
		top = (top===undefined)?true:top;

		if (stop.indexOf(this) === -1) {
			stop.push(this);
			if (this.getValue() === undefined) {
				var d = this.getValues ();

				if (!d || (d.length === 0)) {
					return false;
				}

				var r = false;
				
				d.forEach (function (value) {
					if (self.setValue(value)) {
					
						var save = true;
						self.share.not_equal.forEach (function (v) {
							save = save && v.tryValues(stop.splice(0), false);
						});
			
						self.setValue(undefined);
						
						if (!save && top) {
							self.setNoValue(value);
						}
						else {
							r = true;
						}
					}
				});
				
				return r;
			
			}
		}
		
		return true;
	};
	
	this.checkValues = function () {
		var values = self.getValues ();

		if (values.length ===1) {
			// this is the only possible value to this var, so set it.
			self.setValue(values[0]);
		}		
	};
	
	/*
	 * TODO: replace this function by this.checkValues
	 */
	var checkValues = this.checkValues;
	
	/*
	 * set no value,
	 */
	this.setNoValue = function (value, oldValue, obj) {
		obj = obj || this;
		var change = false;

		if (value !==undefined) {
			if (!this.share.no_values[value]) {
				this.share.no_values[value] = [];
			};

			var index = this.share.no_values[value].indexOf(obj);
			
			if (index === -1) {
				this.share.no_values[value].push(obj);
				change = true;
			}
		}
		else if (this.share.no_values[oldValue]) {
			var index = this.share.no_values[oldValue].indexOf(obj);
			if (index !== -1) {
				this.share.no_values[oldValue].splice(index, 1);
				
				if (this.share.no_values[oldValue].length === 0) {
					delete this.share.no_values[oldValue];
					change = true;
				}
			}
		}
		
		checkValues();
		
		if (change) {runChange();}
	};
	
	
	/*
	 * set value,
	 */
	this.setValue = function (value) {
		var tv = self.getValue();
		
		if (value === undefined) {
			var index = this.share.value.vars.indexOf(this);
			if (index !== -1) {
				this.share.value.vars.splice(index, 1);
			}
			
			this.share.not_equal.forEach (function (no) {
				no.setNoValue(value, self.share.value.value, self);
			});
		
			if (this.share.value.vars.length === 0) {
				this.share.value.value = undefined;
				runChange();
			}
			
			return true;
		}
		else if ( (
				(value === tv)
				|| (tv === undefined)
			)
			&& !self.share.no_values[value]
		) {
			var oldValue = self.share.value.value;
			self.share.value.value = value;

			if (self.share.value.vars.indexOf(self) === -1) {
				self.share.value.vars.push(self);

				this.share.not_equal.forEach (function (no) {
					no.setNoValue(value, undefined, self);
				});
			}

			if (oldValue !== value) {
				runChange();
			}

			return true;
		}
		
		return false;
	};
	
	/* 
	 * Unify,
	 */
	this.unify = function (v) {
		// Check if var can be unified by reference,
		if (v === this) {return true;}
		
		if (
			(self.share.not_equal.indexOf(v) === -1)
			&& (self.share.equal.indexOf(v) ===-1)
		) {
			var vv = v.getValue();
			var tv = self.getValue();

			// Check if var can be unified by value,
			if ( ( 
					(vv === tv)
					|| (vv === undefined)
					|| (tv === undefined)
				)
				&& !self.share.no_values[vv]
				&& !v.share.no_values[vv]
			) {
				self.share.equal.push(v);

				var share = v.share;
				
				v.share = self.share;
				
				// merge equals,
				share.equal.forEach (function (v) {
					if (self.share.equal.indexOf(v) === -1) {
						self.share.equal.push(v);
					}
				});

				// merge not equals,
				share.not_equal.forEach (function (v) {
					if (self.share.not_equal.indexOf(v) === -1) {
						self.share.not_equal.push(v);
					}
				});
					
				// merge values,
				share.value.vars.forEach (function (v) {
					if (self.share.value.vars.indexOf(v) === -1) {
						self.share.value.vars.push(v);
					}
				});
				
				// merge domain,
				for (var i in share.domain) {
					share.domain[i].forEach (function (v) {
						if (!self.share.domain[i]) {
							self.share.domain[i] = [];
						}
							
						if (self.share.domain[i].indexOf(v) === -1) {
							self.share.domain[i].push(v);
						}
					});
				}
					
				// merge no values,
				for (var i in share.no_values) {
					share.no_values[i].forEach (function (v) {
						if (!self.share.no_values[i]) {
							self.share.no_values[i] = [];
						}
							
						if (self.share.no_values[i].indexOf(v) === -1) {
							self.share.no_values[i].push(v);
						}
					});
				};

				checkValues();

				if ((vv!==undefined)) {
					self.share.value.value = vv;
				}
				
				// TODO: check if there is really change and run change 
				runChange();
				
				return true;
			}
				
		}
		
		return false;
	};
	
	/*
	 * Not unify,
	 */
	this.notUnify = function (v) {
		// Check if var is not unifiable by reference,
		if (
			(self.share.not_equal.indexOf(v) === -1)
			&& (self.share.equal.indexOf(v) ===-1)
		) 
		{
			var vv = v.getValue();
			var tv = self.getValue();

			// Check if var can be not unified by value,
			if ( ( 
				(vv !== tv)
				|| (vv === undefined)
				|| (tv === undefined)
				)
			) {
				self.share.not_equal.push(v);
				v.share.not_equal.push(self);
				
				// setup no values,
				if (tv !== undefined) {
					if (v.share.no_values[tv]) {
						v.share.no_values[tv] = [];
					}
					
					// setup no values on v,
					self.share.value.vars.forEach (function (e) {
						if (!v.share.no_values[tv]) {
							v.share.no_values[tv] = [];
						}
						
						if (v.share.no_values[tv].indexOf(e) === -1) {
							v.share.no_values[tv].push(e);
						}
					});
				}	
				
				// setup no values on self,
				if (vv !==undefined) {
					v.share.value.vars.forEach (function (e) {
						if (!self.share.no_values[vv]) {
							self.share.no_values[vv] = [];
						}
						
						if (self.share.no_values[vv].indexOf(e) === -1) {
							self.share.no_values[vv].push(e);
						}
					});
				}
				
				checkValues();
				
				v.checkValues();
				
				return true;
			}
		}
		
		return false;
	};

	/*
	 * TOOD: remove deprecated name, 
	 */
	this.not_unify = this.notUnify;

	this.setV = function (v) {
		if (v instanceof Variable) {
			this.unify(v);
		}
		else {
			this.setValue(v);
		}
	};

/*
	this.__defineGetter__("v", this.getValue);
	this.__defineSetter__("v", this.setV);
*/

	if (options) {
		if (options.value !== undefined) {
			this.setValue(options.value);
		}
		
		if (options.domain) {
			options.domain.forEach (function (x) {
				if (!self.share.domain[x]) {
					self.share.domain[x] = [];
				};
				
				self.share.domain[x].push(self);
			});
			
			checkValues(); // check values in case domain is already length 1.
		}
	}

	
	/*this.isIn = function (v) {
		return this.getValues().indexOf(v.getValue()) !== -1;
	};*/
	
};

function v(options) {
	return new Variable(options);
};

exports.v = v;
exports.Variable = Variable;

/*
var domain = ["yellow", "blue", "red"];

var a = v({domain: domain});
var b = v({domain: domain});
// var c = v({domain: domain});

a.not_unify(b);
// a.not_unify(c);
// b.not_unify(c);

// TODO: mk a way to remove restrain from table.
b.setNoValue("blue");
b.setNoValue("red");
b.setNoValue(undefined, "red");

// a.v = "blue";
console.log(b.getValues());
// console.log(a.tryValues());
*/
