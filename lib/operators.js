var types = require("./types.js");
var rename = require("./rename.js");
var zparser = require("./zparser.js");

function getVariableTuple (table, name) {
	var t = getVariableValue(table, name);
	if (t && (t.type === 'tuple')) {
		return t;
	}
}

function getVariableValue (table, name) {
	var v = getVariable(table, name);
	
	if (v && v.value) {
		return v.value;	
	}
}

function getVariable (table, name) {
	var v = table.vars[name];
	
	if (v.type === 'defered') {
		return getVariable(table, v.defered);
	}
	
	return v;
}

function defer (table, p, q) {
	if (p.name !== q.name) {
		var varP = table.vars[p.name];
		if (varP) {
			if (varP.type === 'defered') {
				defer(table, varP.defered, q);
			}
			else {
				table.vars[q.name] = {
					type: "defered",
					variable: q.variable,
					defered: p
				};
			}
		}
		else if (table.vars[q.name]) {
			defer(table, q, p);
		}
		else {
			table.vars[p.name] = {
				type: "value",
				variable: p
			};
			defer(table, p, q);
		}
	}
}

function setValue (table, p, value) {
	table.vars = table.vars || {};
	var	varP = table.vars[p.name];
	
	if (!varP) {
		table.vars[p.name] = {
			type: 'value', 
			variable: p,
			value: value.value,
			notEquals: value.notEquals
		};	
	}
	else if (varP.type === 'defered') {
		setValue(table, p.defered, value);
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
				table = merge(table, t);
			}
		}
		else {
			varP.value = value.value;
		}
	}
	
	return table;
}

function merge (tableA, tableB) {
	
    if (tableA && tableB) {
    	var table = {};
		var varA;
		var varB;
    	
    	tableB = rename.renameTablesVars(tableB, rename.getNewNames(tableA.bound, tableB.bound));
		table.bound = tableB.bound.concat(tableA.bound);

    	// Setup defered vars,
    	for (var i in tableA.vars) {
			varA = tableA.vars[i];
			
			if (varA.type === 'defered') {
				defer(table, varA.variable, varA.defered);
			}
    	}

    	for (var i in tableB.vars) {
			varB = tableB.vars[i];
			
			if (varB.type === 'defered') {
				defer(table, varB.variable, varB.defered);
			}
    	}
	
		// Setup value vars 	
		for (var i in tableA.vars) {
			varA = tableA.vars[i];
			
			if (varA.type === 'value') {
				table = setValue(table, varA.variable, varA);
			}
    	}

    	for (var i in tableB.vars) {
			varB = tableB.vars[i];
			
			if (varB.type === 'value') {
				table = setValue(table, varB.variable, varB);
			}
    	}

		// 1) check variables with not equals,
		// 2) try to unify value with not equals [remove the ones that dont]
		// 3) if a value unify with a not equal check if they are equal if yes: fail.
    	
    	return table;
    }
}

var operators = {
	unify: {
		variable: {
			variable: function (p, q) {
				var table = {vars: {}};
				table.vars[q.name] = {
					type: "defered",
				    variable: p,
				    defered: q
				};
				table.vars[p.name] = {
					type: "value",
				    variable: p
				};
				
				return table;
			},
			tuple: function (p, q) {
				var table = {
					vars: {},
					bound: []
				};
		
				table.bound = table.bound.concat(q.bound || []);
				table.vars[p.name] = {
					type: "value",
					variable: p,
				    value: q
				};
				
				return table;
			},
			constant: function (p, q) {
				var table = {
					vars: {},
					bound: []
				};
				
				table.vars[p.name] = {
					type: "value",
					variable: p,
				    value: q
				};
				
				return table;
			}
		},
		tuple: {
			variable: function (p, q) {
				return operators.unify[q.type][p.type](q, p);
			},
			tuple: function (p, q) {
			    var table = {
			    	vars: {},
			    	bound: (p.bound || []).concat(q.bound || [])
			    };
			    
				if (p.tuple.length === q.tuple.length) {
					for (var i=0; i< p.tuple.length; i++) {
						var a = p.tuple[i];
						var b = q.tuple[i];

						table = merge(table, operators.unify[a.type][b.type](a, b));
						if (!table) {
						    return;
						}
						
					}
					
					return table;
				}
				// fail,
			},
			constant: function (table, p, q) {
				// can't unify constant with a tuple.
			}
		},
		constant: {
			variable: function (p, q) {
				return operators.unify[q.type][p.type](q, p);
			},
			tuple: function (p, q) {},
			constant: function (p, q) {
				if (p.value === q.value) {
				    return {
				    	vars: {},
				    	bound: []
				    };
				}
			}
		}
		
	}
};


function queryTable(p, table, defs, deep, level) {
	if (table) {
		var v; 
		for (var i=0; i<p.tuple.length; i++) {
			v = p.tuple[i];
			var t;
			if (v.type === 'variable') {
				t = getVariableTuple(table, v.name);
			}
			else if (v.type === 'tuple') {
				t = v;
			}
			
			if (t) {
				var childs = queryStep(t, defs, deep, level);
				
				if (childs) {
					table.childs = [];
					for (var j=0; j<childs.length; j++) {
						var m = merge(table, childs[j]);

						if (m) {
							table.childs.push(m);
						}
					}
				}
				else {
					return;
				}
			}
		}
		
		return table;
	}
}

/*
	Query step, 
*/
function queryStep (p, defs, deep, level) {
	if (!deep || (level < deep)) {
		var results = [];
		var pVars = rename.getTupleVariables(p);
		
		for (var i=0; i<defs.length; i++) {
			var q = defs[i];

			q = rename.renameTupleVars(q, rename.getNewNames(pVars, q.bound));

			var t = queryTable(
						p,
						operators.unify.tuple.tuple(p, q),
						defs,
						deep,
						level + 1
					);
			if (t) {
				results.push(t);
			}
		}
		
		if (results.length > 0) {
			return results;
		}
	}
}

/*
	Query init. 
	Initialize all tuples and variables.
*/
function query (p, defs, deep) {
	// prepare q,
	p.bound = rename.getTupleVariables(p);

	for (var i=0; i<defs.length; i++) {
		var q = defs[i];
		q.bound = rename.getTupleVariables(q);
	}
	
	var r = queryStep(p, defs, deep, 0);
	
	return {
		query: p,
		result: r
	};
}

function zquery (r, deep) {
	if (typeof r === 'string') {
		r = zparser.parse(r);
	}
	
	var results = [];
	if (r.queries) {
		for (var i=0; i<r.queries.length; i++) {
			var res = query(r.queries[i].tuple, r.definitions, deep);
			results.push(res);
		}
	}
	
	return results;
}

function run (defs) {
	return function (q) {
		return query(q, defs);
	};
}

module.exports = {
	run: run
};

/*
var r = zquery("(nat 0) (nat (nat 'x)) ?(nat 'x) ?(nat 1)");
console.log(JSON.stringify(r, null, '  '));
*/

/*
var r  = zquery(
	"(mary likes food) " +
	"(mary likes wine) " +
	"(john likes wine) " +
	"(john likes mary) " +
	"?('x likes wine)"
);


console.log(JSON.stringify(r, null, '  '));*/