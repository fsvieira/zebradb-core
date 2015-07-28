var rename = require("./rename.js");
var zparser = require("./zparser.js");

var _operators = {
	renameTablesVars: rename.renameTablesVars,
    getTupleVariables: rename.getTupleVariables,
    getNewNames: rename.getNewNames,
    renameTupleVars: rename.renameTupleVars,
    giveNames: rename.giveNames
};

_operators.getVariableTuple = function (table, name) {
	var t = _operators.getVariableValue(table, name);
	if (t && (t.type === 'tuple')) {
		return t;
	}
};

_operators.getVariableValue = function (table, name) {
	var v = _operators.getVariable(table, name);
	
	if (v && v.value) {
		return v.value;	
	}
};

_operators.getVariable = function  (table, name) {
	var v = table.vars[name];
	
	if (v && (v.type === 'defered')) {
		return _operators.getVariable(table, v.defered);
	}
	
	return v;
};

_operators.defer = function (table, p, q) {
	if (p.name !== q.name) {
		var varP = table.vars[p.name];
		if (varP) {
			if (varP.type === 'defered') {
				_operators.defer(table, varP.defered, q);
			}
			else {
				table.vars[q.name] = {
					type: "defered",
					variable: q,
					defered: p
				};
			}
		}
		else if (table.vars[q.name]) {
			_operators.defer(table, q, p);
		}
		else {
			table.vars[p.name] = {
				type: "value",
				variable: p
			};
			_operators.defer(table, p, q);
		}
	}
};

_operators.setValue = function (table, p, value) {
	table.vars = table.vars || {};
	var	varP = table.vars[p.name];
	
	if (!varP) {
		table.vars[p.name] = {
			type: 'value', 
			variable: p,
			value: value.value,
			notEquals: value.notEquals?value.notEquals.slice(0):undefined
		};	
	}
	else if (varP.type === 'defered') {
		_operators.setValue(table, varP.defered, value);
	}
	else {
		if (varP.notEquals) {
			varP.notEquals = varP.notEquals.concat(value.notEquals || []);
		}
		else if (value.notEquals) {
			varP.notEquals = value.notEquals.slice(0);
		}
		
		if (varP.value) {
			if (value.value) {
				var t = operators.unify[varP.value.type][value.value.type](varP.value, value.value);
				table = _operators.merge(table, t);
			}
		}
		else {
			varP.value = value.value;
		}
	}
	
	return table;
};

_operators.cmpTuples = function (cmpTable, a, b) {
	for (var i=0; i<a.tuple.length; i++) {
		var vA = a.tuple[i];
		var vB = b.tuple[i];
		
		if (vA.type === 'variable') {
			vA = _operators.getVariableValue(cmpTable, vA.name);
		}
		
		if (vB.type === 'variable') {
			vB = _operators.getVariableValue(cmpTable, vB.name);
		}
		
		if (vA && vB) {
			if ((vA.type === 'tuple') && (vB.type === 'tuple')) {
				if (!_operators.cmpTuples(cmpTable, vA, vB)) {
					return false;
				}
			}
			else if ((vA.type === 'constant') && (vB.type === 'constant')) {
				if (vA.value !== vB.value) {
					return false;
				}
			}
			else {
				return;
			}
		}
		else {
				return;
		}
	}
	
	return true;
};

_operators.merge = function (tableA, tableB) {
	
    if (tableA && tableB) {
    	var varA;
		var varB;

    	var table = {
    		vars: {}
    	};

    	tableB = _operators.renameTablesVars(tableB, _operators.getNewNames(tableA.bound, tableB.bound));
		table.bound = tableB.bound.concat(tableA.bound);

    	// Setup defered vars,
    	for (var i in tableA.vars) {
			varA = tableA.vars[i];
			
			if (varA.type === 'defered') {
				_operators.defer(table, varA.variable, varA.defered);
			}
    	}

    	for (var i in tableB.vars) {
			varB = tableB.vars[i];
			
			if (varB.type === 'defered') {
				_operators.defer(table, varB.variable, varB.defered);
			}
    	}
	
		// Setup value vars 	
		for (var i in tableA.vars) {
			if (!table) {
				break;
			}
			varA = tableA.vars[i];
			
			if (varA.type === 'value') {
				table = _operators.setValue(table, varA.variable, varA);
			}
    	}
		
		if (table) {
	    	for (var i in tableB.vars) {
				if (!table) {
					break;
				}

				varB = tableB.vars[i];
				
				if (varB.type === 'value') {
					table = _operators.setValue(table, varB.variable, varB);
				}
	    	}
		}

		// 1) check variables with not equals,
		// 2) try to unify value with not equals [remove the ones that dont]
		// TODO: check not equals vars by reference.
		if (table) {
	    	for (var i in table.vars) {
				var a = table.vars[i];
				
				if (a.value && a.notEquals) {
					var av = a.value;
					
					for (var j=0; j<a.notEquals.length; j++) {
						var ne = a.notEquals[j];

						if (ne.type === 'variable') {
							ne = _operators.getVariableValue(table, ne.name);
						}
						
						if (ne) {
							// ne and av are values.
							var fail = false;
							if (av.type === ne.type) {
								if (av.type === 'tuple') {
									fail = _operators.cmpTuples(table, av, ne);
								}
								else if (av.value === ne.value) {
									fail = true;
								}
							}
							
							if (fail === true) {
								// it was found a contradiction, this branch is not a solution.
								return;
							}
							else if (fail === false) {
								// the not value will never be equal to variable value, we can safely remove it.
								a.notEquals.splice(j, 1);
							}
							// else, it is not determined the not value will not unify with variable value.
							// do nothing.
						}
					}
				}
	    	}			

			// 3) if a value unify with a not equal check if they are equal if yes: fail.
			if (tableA.childs && tableB.childs) {
				table.childs = [];
				for (var i=0; i<tableA.childs.length; i++)	{
					a = tableA.childs[i];
					for (var j=0; j<tableB.childs.length; j++)	{
						var b = tableB.childs[i];
						var m = _operators.merge(a, b);
						if (m) {
							table.childs.push(m);
						}
					}
				}
			}
			else if (tableA.childs) {
				table.childs = [];
				for (var i=0; i<tableA.childs.length; i++)	{
					a = tableA.childs[i];
					m = _operators.merge(a, tableB);
					if (m) {
						table.childs.push(m);
					}
				}
			}
			else if (tableB.childs) {
				table.childs = [];
				for (var i=0; i<tableB.childs.length; i++)	{
					a = tableB.childs[i];
					m = _operators.merge(a, tableA);
					if (m) {
						table.childs.push(m);
					}
				}
			}
			
			if (table.childs && (table.childs.length === 0)) {
				// bad table.
				return;
			}
		}
		
    	return table;
    }
};


_operators.unify_variable_variable = function (p, q) {
	var table = {
		vars: {},
		bound: []
	};
				
	table.vars[q.name] = {
		type: "defered",
	    variable: p,
	    defered: q,
	};

	table.vars[p.name] = {
		type: "value",
	    variable: p,
	    notEquals: (p.notEquals || []).concat(q.notEquals || [])
	};
				
	return table;
};

_operators.unify_variable_tuple = function (p, q) {
	var table = {
		vars: {},
		bound: []
	};
		
	table.bound = table.bound.concat(q.bound || []);
	table.vars[p.name] = {
		type: "value",
		variable: p,
	    value: q,
	    notEquals: p.notEquals?p.notEquals.slice(0):undefined
	};
				
	return table;
};

_operators.unify_variable_constant = function (p, q) {
	var table = {
		vars: {},
		bound: []
	};
				
	table.vars[p.name] = {
		type: "value",
		variable: p,
		value: q,
		notEquals: p.notEquals?p.notEquals.slice(0):undefined
	};
				
	
	return table;
};

_operators.unify_tuple_variable = function (p, q) {
	return operators.unify[q.type][p.type](q, p);
};

_operators.unify_tuple_tuple = function (p, q) {
    var table = {
    	vars: {},
	   	bound: (p.bound || []).concat(q.bound || [])
	};
			    
	if (p.tuple.length === q.tuple.length) {
		for (var i=0; i< p.tuple.length; i++) {
			var a = p.tuple[i];
			var b = q.tuple[i];

			var uTable = operators.unify[a.type][b.type](a, b);

			table = _operators.merge(table, uTable);
			if (!table) {
				return;
			}
						
		}

		return table;
	}
	
	// fail,
};

_operators.unify_tuple_constant = function (p, q) {};

_operators.unify_constant_variable = function (p, q) {
	return operators.unify[q.type][p.type](q, p);
};

_operators.unify_constant_tuple = function (p, q) {};

_operators.unify_constant_constant = function (p, q) {
	if (p.value === q.value) {
	    return {
	    	vars: {},
	    	bound: []
	    };
	}
};

var operators = {
	unify: {
		variable: {
			variable: _operators.unify_variable_variable,
			tuple: _operators.unify_variable_tuple,
			constant: _operators.unify_variable_constant
		},
		tuple: {
			variable: _operators.unify_tuple_variable,
			tuple: _operators.unify_tuple_tuple,
			constant: _operators.unify_tuple_constant
		},
		constant: {
			variable: _operators.unify_constant_variable,
			tuple: _operators.unify_constant_tuple,
			constant: _operators.unify_constant_constant
		}
	}
};


_operators.queryTable = function (p, table, defs, deep, level) {
	if (table) {
		var v; 
		for (var i=0; i<p.tuple.length; i++) {
			v = p.tuple[i];
			var t;
			if (v.type === 'variable') {
				t = _operators.getVariableTuple(table, v.name);
			}
			else if (v.type === 'tuple') {
				t = v;
			}
			
			if (t) {
				var childs = _operators.queryStep(table, t, defs, deep, level);
				
				if (childs) {
					table.childs = childs;
				}
				else {
					return;
				}
			}
		}
		
		return table;
	}
};

/*
	Query step, 
*/
_operators.queryStep = function (table, p, defs, deep, level) {
	if (!deep || (level < deep)) {
		var results = [];
		var pVars = _operators.getTupleVariables(p);
		
		table = table || {vars: {}, bound: []};
		
		for (var i=0; i<defs.length; i++) {
			var q = defs[i];

			q = _operators.renameTupleVars(q, _operators.getNewNames(pVars, q.bound));

			// TODO: make this function a single step:
			// 1. return only unify results, or ...
			// 2. put query table code here.
			// ==> merge unify tables before calling queryStep/queryTable again.
			var t = operators.unify.tuple.tuple(p, q);
			if (t) {
				t = _operators.merge(table, t);
			}
			
			if (t) {
				t = _operators.queryTable(
					p,
					t,
					defs,
					deep,
					level + 1
				);
			}

			if (t) {
				results.push(t);
			}
		}
		
		if (results.length > 0) {
			return results;
		}
	}
};

/*
	Query init. 
	Initialize all tuples and variables.
*/
_operators.query = function (p, defs, deep) {
	// prepare q,
	p = _operators.giveNames(p);

	for (var i=0; i<defs.length; i++) {
		defs[i] = _operators.giveNames(defs[i]);
	}
	
	var r = _operators.queryStep(undefined, p, defs, deep, 0);
	
	return {
		query: p,
		result: r
	};
};

_operators.zquery = function (r, deep) {
	if (typeof r === 'string') {
		r = zparser.parse(r);
	}
	
	var results = [];
	if (r.queries) {
		for (var i=0; i<r.queries.length; i++) {
			var res = _operators.query(r.queries[i].tuple, r.definitions, deep);
			results.push(res);
		}
	}
	
	return results;
};

_operators.run = function (defs) {
	if (typeof defs === 'string') {
		defs = zparser.parse(defs).definitions;
	}

	return function (q, deep) {
		if (typeof q === 'string') {
			q = zparser.parse(q).definitions[0];
		}
		
		return _operators.query(q, defs, deep);
	};
};


require("./moduletestmaker.js").proxy(_operators, {
	prefix: "operators.",
	out: "logs/operators",
	replace: true,
	init: "var operators = require('../lib/operators.js');\n\n",
	enable: false
});

module.exports = _operators;
/*
module.exports = {
	run: _operators.run
};
*/

