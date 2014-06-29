function Variable (options) {

	options = options || {};
	
	var _value  = options.value;
	var _domain = options.domain || [];
	
	var _unify = [];
	var _notUnify = [];
	
	var _stack = [];
	var _self = this;

	// Find the value from the var itself or unifyed variables.
	this.get_value = function () {
		var value = this.getValue();
	
		if (value === undefined) {
			var values = this.getValues();
			if (values.length === 1) {
				return values[0].get_value();
			};
		}
		
		return value;
	};
	
	this.getValue = function (stop) {
		var value = _value;
		stop = stop || [];
		if (stop.indexOf(this) === -1) {
			stop.push(this);

			if (value === undefined) {
				for (var i=0; i<_unify.length; i++) {
					value = _unify[i].getValue(stop);
					
					if (value !== undefined) {
						return value;
					}
				}
			}
		}
		
		return value;
	};


	// Simple test to var constrains:
	Variable.state = {
		UNIFY_BY_VALUE: (1 << 1),
		UNIFY_BY_VAR: (1 << 2),
		NOT_UNIFY_BY_VALUE: (1 << 3),
		NOT_UNIFY_BY_VAR: (1 << 4),
		VAR_NOT_IN: (1 << 5),
		VALUE_UNDEFINED: (1 << 6),
	};
	
	this.unifyStateVar = function (v, state, stop) {
		state = state || 0;
		stop = stop || [];
		
		if (stop.indexOf(this) === -1) {
			stop.push(this);

			if (v === this) {
				// v is on the unify set so return true;
				state |= Variable.state.UNIFY_BY_VAR;
				return state;
			}
			
			// Search var in the unifiable vars,
			for (var i=0; i<_unify.length; i++) {
				var vv = _unify[i];
				state = vv.unifyStateVar(v, state, stop);
				
				if (state & Variable.state.NOT_UNIFY_BY_VAR) {
					return state;
				};
			};
			
			// Search var in the not unifiable vars,
			for (var i=0; i<_notUnify.length; i++) {
				var vv = _notUnify[i];
				// if v is unifiable with a not unifable vars, 
				// than v is not unifable. 
				state = vv.unifyStateVar(v, state, stop);
				
				if (state & Variable.state.UNIFY_BY_VAR) {
					return state;
				};
			}
		}
		
		return state;
	};
	
	this.unifyState = function (v) {
		var state = 0;
		var vValue = v.getValue();
		
		if (vValue === undefined) {
			state |= Variable.state.VALUE_UNDEFINED;
		}
		else {
			var value = this.getValue();
			
			if (value !== undefined) {
				if (value === vValue) {
					state |= Variable.state.UNIFY_BY_VALUE;
				}
				else {
					state |= Variable.state.NOT_UNIFY_BY_VALUE;
				}
				
				return state;
			}
			else {
				for (var i=0; i<_notUnify.length; i++) {
					var value = _notUnify[i].getValue();
					if (value !== undefined) {
						// if values are the same as not unify variable, than
						// variable is not unifiable.
						if (vValue === value) {
							state |= Variable.state.NOT_UNIFY_BY_VALUE;
							return state;
						}
					}
				}
			}
		}
		
		state = this.unifyStateVar(v, state);
		
		if (!(state & (Variable.state.NOT_UNIFY_BY_VAR | Variable.state.VAR_NOT_UNIFY_BY_VAR))) {
			state |= Variable.state.VAR_NOT_IN;
		}
		
		return state;
	};


	// Unify var if simple constrains are ok
	this.unify = function (v) {
		var state = this.unifyState(v);
		if (_unify.indexOf(v) === -1) {
			if (state & (Variable.state.UNIFY_BY_VAR | Variable.state.UNIFY_BY_VALUE | Variable.state.VAR_NOT_IN)) {
				_unify.push(v);
				v.unify(this);
				return true;
			}
			return false;
		}
		
		return true;
	};
	
	this.not_unify = function (v) {
		var state = this.unifyState(v);
		if (_notUnify.indexOf(v) === -1) {
			if (state & (Variable.state.NOT_UNIFY_BY_VAR | Variable.state.NOT_UNIFY_BY_VALUE | Variable.state.VAR_NOT_IN)) {
				_notUnify.push(v);
				v.not_unify(this);
				return true;
			}
			return false;
		}
		
		return true;
	};
	
	// Simple save/load var state functions 
	this.save = function () {
		_stack.push({
			unify: _unify.slice(0),
			notUnify: _notUnify.slice(0),
		});
		return this;
	};
	
	this.load = function () {
		var s = _stack[_stack.length-1];
		_unify = s.unify.slice(0);
		_notUnify = s.notUnify.slice(0);
		return this;
	};
	
	this.free = function () {
		this.load();
		_stack.pop();
		return this;
	};


	/*
	 * TODO: Make smarter analyse tools:
	 */
	this.isIn = function (v) {
		var d = this.getValues();
		
		for (var i=0; i<d.length; i++) {
			if (d[i].getValue() === v.getValue()){
				return true;
			}
		}
		
		return false;
	};
	
	// try possible values:
	this.getNotValues = function () {
		var result = [];
		_notUnify.forEach (function (v) {
			var value = v.getValue();
			if (value !== undefined) {
				if (result.indexOf(value) === -1){
					result.push(value);
				}
			}
		});
		
		return result;
	};
	
	this.getValues = function () {
		var value = this.getValue();
		
		if (value === undefined ) {
			var noValues = this.getNotValues();
			var result = [];
			
			_domain.forEach (function (v) {
				var value = v.getValue();
				if (noValues.indexOf(value) === -1) {
					if (result.indexOf(v) === -1){
						result.push(v);
					}
				}
			});
			
			return result;
		}
		
		return [this];
	};

	/*
	 * Get possible values to all variables:
	 */
	this.constrain = function (d) {
		this.getValues().forEach (function (v) {
			if (d.indexOf(v) === -1) {
				_self.not_unify(v);
			}
		});
	}; 
	 
	this.tryValues = function () {
		var r = this.tryValuesAux();
		
		r.variables.forEach (function (v, index) {
			v.constrain(r.domain[index]);
		});
	};
	
	this.tryValuesAux = function (result) {
		var value = this.getValue();
		var result = result || {variables: [], domain: []};
		
		var index = result.variables.indexOf(this);			
			
		if (index === -1) {
			index = result.variables.length;
			result.variables.push(this);
			result.domain.push([]);
		}
		
		var d = result.domain[index];	
		
		if (value === undefined ) {
			_self.save();
			this.getValues().forEach (function (value) {
				_self.load();
				value.save();
				if (_self.unify(value)) {
					var ok = true;
					
					_notUnify.forEach (function (v) {
						var r = v.tryValuesAux();
						r = r.domain[r.variables.indexOf(v)];
						if (r.length === 0) {
							ok = false;
						}
					});
					
					if (ok && (d.indexOf(value) === -1)) {
						d.push(value);
					}
				}
				value.load();
				value.free();
			});
			_self.free();
		}
		else {
			if (d.indexOf(this) === -1) {
				d.push(this);
			}
		}
		
		return result;
	};

};

function v(options) {
	return new Variable (options);
};

exports.v = v;
exports.Variable = Variable;
