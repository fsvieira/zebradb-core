var _trace = [];
var _current = _trace;
var _level = 0;

var error;

function toString (args) {
	var s = "";
	for (var i in args) {
		var o = args[i];
		var r;
		
		if (o.name) {
			r = o.name();
		}
		else if (o instanceof Object) {
			r = "";
			for (var i in o) {
				r += i + ":" + ((o[i] instanceof Array)?"["+o[i]+"]":o[i]) + ", ";
			}
			
			r = "{"+r+"}";
		}
		else {
			r = "" + o;
		}

		s += ", " + r;
	}
	
	if (s.length > 2) {
		s = s.slice(2);
	}
	
	return s;
};

function Proxy (obj, opt) {
	var counter = 0;
	var opt = opt || {};

	var p = function () {
		var name = (opt.name || obj.prototype.constructor.name) + "_" + counter++;

		obj.apply(this, arguments);
		var self = this;

		self.parent = {};

		function call () {
			var fn = arguments[0];

			if (((fn === 'after') || (fn === 'before')) && (_level!==1)) {
				// Dont do anything, this call is internal call.
				return; 
			}

			if (p.proxy[fn]) {
				return p.proxy[fn].apply(self, arguments);
			}
		}

		for (var i in this) {
			var fn = this[i];
			if (fn.apply) {
				// p.proxy.parent[i] = fn;
				self.parent[i] = fn; // use this insted...

				this[i] = function () {
					var b, r, c, _c;
					_c = _current;
					_level++;
					if (opt.notrace && opt.notrace.indexOf(this.name) !== -1) {
						_current = undefined;
					}

					if (_current) {
						var affect = opt.affect && (opt.affect.indexOf(this.name) !== -1);
						c = {t:"call", name: name, fn: this.name, args: arguments, calls: [], affect: affect};
						_current.push(c);
						_current = c.calls; 
					}

					try {
						b = call("before", name, this.name, arguments);
						r = this.fn.apply(self, arguments);						
				
						if (c) {
							c.result = {value: r};
						}
	
						call("after", b, name, this.name, arguments, r);
					}
					catch (err) {
						c.error = err; // TODO: propagate error to top??
						if (!error) {
							call("error", name, this.name, arguments, err);
						}
						else {
							error(name, this.name, arguments, err);
						}
					}
					finally {
						_level--;
					}
					
					_current = _c;
					
					return r;
				}.bind({name: i, fn: fn});
			}
		}

		_current.push({
			t: "new",
			name: name,
			obj: obj,
			proxy: p,
			args: arguments
		});

		call("init", name, arguments);
		
		this.name = function () {
			return name;
		};
		
		this.setName = function (n) {
			name = n;
		};
	};

	p.proxy = {
		// parent: {},
		error: function (t, name, fn, arguments, err) {
			// throw new Error(err.error);
			throw err;
		}
	};
	p.prototype = new obj;
	
	
	return p;
};

function testcase (actions) {
	var s = "";
	actions = actions || _trace;
	
	actions.forEach (function (action, index) {
		if (action.error) {
			s+="/*\n\t" + action.error.error +"\n\t" + action.error.msg + "\n*/\n";
		}
		
		if (action.t === "new") {
			s += "\t\tvar " + action.name + " = new " + action.obj.prototype.constructor.name + "("+toString(action.args)+");\n"; 
		}
		else {
			if (action.affect) {
				s += "\t\tvar " + toString(action.result) + " = " + action.name + "." + action.fn + "("+toString(action.args) + ");\n";
			}
			else {
				s +="\t\tshould(" + action.name + "." + action.fn + "("+toString(action.args)+")).eql("+toString(action.result)+");\n";
			}
		}
	});
	
	return s;
}

function getActions () {
	var actions = [];
	_trace.forEach (function (action, index) {
		actions.push(action);
	});
	
	return actions;
};

function run (actions, ignore, o_error) {
	var vars = {};
	var err = false;
	
	var trace = _trace;
	var current = _current;
	var level = _level;
	
	_trace = [];
	_current = _trace;
	_level = 0;

	error = function (name, fn, args, e) {
		// console.log(name + "." + fn + "(" + toString(args) + ") " +err);
		// console.log(e.error);
		// console.log(o_error.error +" === " + e.error);
		// console.log(o_error.msg +" === " + e.msg);
		if ((o_error.error === e.error) && (o_error.msg === e.msg)) {
			err = true;
		}
		/*
		else {
			console.log(name + "." + fn + "(" + toString(args) + ") " +e.error);
		}*/
	};

	var action;
	try {
		for (var i=0; i< actions.length; i++) {
			if (err) {
				return true;
			}
			else if (i !== ignore) {
				action = actions[i];
				
				if (action.t === "new") {
					var a = new action.proxy(action.args);
					vars[action.name] = a;
					a.setName(action.name);
				}
				else {
					var args = [];
					// Setup args,
					for (var j in action.args) {
						args[j] = action.args[j];
						if (args[j].name) {
							args[j] = vars[args[j].name()];
						}
					}

					var r = vars[action.name][action.fn].apply(vars[action.name], args);
					if (action.affect) {
						vars[toString(action.result)] = r;
						if (r.setName) {
							r.setName(toString(action.result));
						}
					}
				}

			}
		}
	}
	catch (err) {
		console.log(err);
		return false;
	}
	finally {
		_trace = trace;
		_current = current;
		_level = level;
		
		error = undefined;
	}
	
	return err;
};

function tryFail (actions, err) {
	for (var i=actions.length-1; i>=0; i--) {
		var r = run(actions, i, err);
		if (r) {
			actions.splice(i, 1); // remove element no affect to error.
		}
		
		console.log("i: " + i + ", l: " + actions.length + ", error: " + r);
		
	}
	
	return actions;
};

function sandbox (err) {
	var trace = _trace;
	var current = _current;
	var r = tryFail(getActions(), err);
	
	return testcase(r);
};


module.exports = {
	trace: _trace,
	Proxy: Proxy,
	testcase: testcase,
	sandbox: sandbox
};



