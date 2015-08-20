/*
	TODO: maybe rename this to vars, as it deals with them mostly.
*/

/**
 * Rename all ocurrences of tuple variables that have a match on the 
 * replace dictonary.
 * 
 * @param {Tuple} q - The tuple where variables are replaced.
 * @param {Object} names - A table variable name and replace name.
 * @return {Tuple} a clone of q with variables replaced.
 */
function renameTupleVars (q, names) {
	if (q) {
		q = JSON.parse(JSON.stringify(q));

		if (q.bound) {
			// assume that there is no repeated names in vars.
			for (var n in names) {
				var index = q.bound.indexOf(n);
	
				if (index !== -1) {
					q.bound[index] = names[n];
				}
			}
		}
		
		for (var i=0; i<q.tuple.length; i++) {
			var v = q.tuple[i];
			
			if (v.type ==='variable') {
				v.name = names[v.name] || v.name;
			}
			
			if (v.type === 'tuple') {
				q.tuple[i] = renameTupleVars(v, names);
			}
		}
		
		return q;
	}
}


/**
 * Find a new name distinct from input array names.
 * 
 * @Param [Array] a - A string array with names.
 * 
 * @return [string] a new names distinct from all other names. 
 */
function findName (names) {
	var i = 0;
	var r;
	do {
		r = "x$" + i++;
	} while(names.indexOf(r) !== -1);
	
	return r;
}

/**
 * Given two string arrays, return the rename table of 
 * clashing names.
 * 
 * @Param [Array] a - A string array with names
 * @Param [Array] b - A string array with names
 * 
 * @return [Object] A table with Name -> New Name. 
 */
function getNewNames (a, b) {
	var all = [];
	var rename = {};
	
	a.forEach (function (name) {
		if (all.indexOf(name) === -1) {
			all.push(name);
		}
		
		if (b.indexOf(name) !== -1) {
			rename[name] = true;
		}
	});
	
	b.forEach (function (name) {
		if (all.indexOf(name) === -1) {
			all.push(name);
		}
		
		if (a.indexOf(name) !== -1) {
			rename[name] = true;
		}
	});

	
	for (var name in rename) {
		var newName = findName(all);
		all.push(newName);
		rename[name] = newName;
	}
	
	return rename;
}


function getTupleVariables (tuple, vars) {
	vars = vars || [];
	for (var i =0; i<tuple.tuple.length; i++) {
		var v = tuple.tuple[i];
		if (v.type === 'variable') {
			if (v.name && (vars.indexOf(v.name) === -1)) {
				vars.push(v.name);
			}
			
			if (v.notEquals) {
				for (var j=0; j < v.notEquals.length; j++) {
					var ne = v.notEquals[j];
					if (ne.name && (vars.indexOf(ne.name) === -1)) {
						vars.push(ne.name);
					}
					else if (ne.type === 'tuple') {
						getTupleVariables(ne, vars);
					}
				}
			}
		}
		else if (v.type === 'tuple') {
			getTupleVariables(v, vars);
		}
	}
	
	return vars;
}

function _giveNames (tuple, names) {
	for (var i =0; i<tuple.tuple.length; i++) {
		var v = tuple.tuple[i];
		if (v.type === 'variable') {
			if (!v.name) {
				v.name = findName(names);
				names.push(v.name);
			}
			
			if (v.notEquals) {
				for (var j=0; j < v.notEquals.length; j++) {
					var ne = v.notEquals[j];
					if (ne.name && (names.indexOf(ne.name) === -1)) {
						names.push(ne.name);
					}
					else if (ne.type === 'tuple') {
						_giveNames(ne, names);
					}
				}
			}
		}
		else if (v.type === 'tuple') {
			_giveNames(v, names);
		}
	}
	
	return names;
}

function giveNames (tuple) {
	tuple = JSON.parse(JSON.stringify(tuple));
	var bound = getTupleVariables(tuple);
	
	tuple.bound = _giveNames(tuple, bound);
	return tuple;
}

// function renameTablesVars (a, b) {
function renameTablesVars (table, names) {
	table = JSON.parse(JSON.stringify(table));

	// rename bound variables,
	for (var i=0; i<table.bound.length; i++) {
		var name = table.bound[i];
		if (names[name]) {
			table.bound[i] = names[name];
		}
	}
	
	// rename table variables,
	for (var name in table.vars) {
		var v = table.vars[name];
		var newName = names[name];
		if (newName) {
			delete table.vars[name];
			table.vars[newName] = v;
			
			v.variable = { // TODO: replace variable ref by a simple string name.
				type: 'variable',
				name: newName
			};
			
		}

		if (v.defered && (newName = names[v.defered.name])) {
			v.defered.name = newName;
		}

		if ((v.type === 'value') && v.value && (v.value.type ==='tuple')) {
			v.value = renameTupleVars(v.value, names);
		}
		
		if (v.notEquals) {
			for (var j=0; j < v.notEquals.length; j++) {
				var ne = v.notEquals[j];
				if (ne.type === 'variable') {
					if (names[ne.name]) { // TODO: make "names" contain all names ? even if the same.
						ne.name = names[ne.name];
					}
				}
				else if (ne.type === 'tuple') {
					renameTupleVars(ne, names);
				}
			}
		}
	}

	return table;
}

module.exports = {
    renameTablesVars: renameTablesVars,
    getTupleVariables: getTupleVariables,
    getNewNames: getNewNames,
    renameTupleVars: renameTupleVars,
    giveNames: giveNames
};

