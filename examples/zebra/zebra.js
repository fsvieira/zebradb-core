var v = require("../../lib/variable").v;

function getVars (domain) {
	var res = [];

	for (var i=0; i<domain.length; i++) {
		var a = v({domain: domain});
		res.push(a);
	}

	// mk distinct vars:
	for (var i=0; i<res.length-1; i++) {
		for (var j=i+1; j<res.length; j++) {
			res[i].not_unify(res[j]);
		}	
	}

	return res;
}

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};


var colors  = [v({value:"yellow"})    , v({value:"blue"})   , v({value:"red"})     , v({value:"green"})  , v({value:"white"})];
var drinks  = [v({value:"water"})     , v({value:"tea"})    , v({value:"milk"})    , v({value:"coffee"}) , v({value:"beer"})];
var people  = [v({value:"norwegian"}) , v({value:"dane"})   , v({value:"english"}) , v({value:"german"}) , v({value:"swede"})];
var smokes  = [v({value:"dunhill"})   , v({value:"blend"})  , v({value:"pallmall"}), v({value:"prince"}) , v({value:"bluemaster"})];
var animals = [v({value:"cats"})      , v({value:"horse"})  , v({value:"birds"})   , v({value:"zebra"})  , v({value:"dog"})];

function initState () {
	return {
		houses: getVars(colors),
		drinks: getVars(drinks),
		people: getVars(people),
		smokes: getVars(smokes),
		animal: getVars(animals)
	};
}

function constrains () {
	var _solution = {
		houses: shuffle(colors),
		drinks: shuffle(drinks),
		people: shuffle(people),
		smokes: shuffle(smokes),
		animal: shuffle(animals)
	};
	
	var constrains = [];
	
	var types = Object.keys (_solution);
	
	for (var t=0; t<types.length; t++) {
		for (var i=0; i < _solution[types[t]].length-1; i++) {
			var x = {type: types[t], variable: _solution[types[t]][i]};
			
			if (i > 0) {
				constrains.push({
					type: "middle",
					x: x,
					constrain: middle
				});
			}
			
			for (var t2=t; t2<types.length; t2++) {
				var y = {type: types[t2], variable: _solution[types[t2]][i+1]};
				var z = {type: types[t2], variable: _solution[types[t2]][i]};
				
				constrains.push({
					type: "immediately to the left of",
					x: x,
					y: y,
					constrain: left_of
				});
				
				var coin = Math.floor(Math.random()*2);
				constrains.push({
					type: "next to",
					x: coin?x:y,
					y: (!coin)?x:y,
					constrain: next_to
				});

				if (t2 !== t) {
					constrains.push({
						type: "same position as",
						x: x,
						y: z,
						constrain: same_pos
					});
				}
			}
		}
	}
	
	return {constrains: constrains, solution: _solution};
};



// Solve
function middle (x, y, state) {
	var change = false;
	
	if (state[x.type][0].isIn(x.variable)) {
		state[x.type][0].not_unify(x.variable);
		change = true;
	}
	
	if (state[x.type][state[x.type].length-1].isIn(x.variable)) {
		state[x.type][state[x.type].length-1].not_unify(x.variable);
		change = true;
	}
	
	return change;
};

function same_pos (x, y, state) {
	var change = false;
	
	for (var xp=0; xp < state[x.type].length; xp++) {
		if (!state[y.type][xp].isIn (y.variable)) {
			if (state[x.type][xp].isIn(x.variable)) {
				state[x.type][xp].not_unify(x.variable);
				change = true;
			}
		}
	}
	
	for (var yp=0; yp < state[x.type].length; yp++) {
		if (!state[x.type][yp].isIn (x.variable)) {
			if (state[y.type][yp].isIn(y.variable)) {
				state[y.type][yp].not_unify(y.variable);
				change = true;
			}
		}
	}
	
	return change;
};

function left_of (x, y, state) {
	var change = false;

	var max = 0;

	for (var yp=0; yp < state[y.type].length; yp++) {
		if (state[y.type][yp].isIn(y.variable)) {
			max = yp;
		}
	}
	
	var min = 0;
	for (var xp=state[x.type].length-1; xp >= 0; xp--) {
		if (state[x.type][xp].isIn(x.variable)) {
			min = xp;
			
			if (xp >= max) {
				if (state[x.type][xp].isIn(x.variable)) {
					state[x.type][xp].not_unify(x.variable);
					change = true;
				}
			}
		}
	}

	for (var yp=0; yp < state[y.type].length; yp++) {
		if (state[y.type][yp].isIn(y.variable)) {
			if (yp <= min) {
				if (state[y.type][yp].isIn(y.variable)) {
					state[y.type][yp].not_unify(y.variable);
					change = true;
				}
			}
		}
	}

	return change;
};

function next_to (x, y, state) {
	var change = false;

	for (var xp=0; xp < state[x.type].length; xp++) {
		if (state[x.type][xp].isIn(x.variable)) {
			if (!(
				   ((xp < state[x.type].length-1) && state[y.type][xp+1].isIn(y.variable))
				   || ((xp > 0) && state[y.type][xp-1].isIn(y.variable))
				)
			) {
				state[x.type][xp].not_unify(x.variable);
				change = true;
			}
		}
	}
	
	for (var yp=0; yp < state[y.type].length; yp++) {
		if (state[y.type][yp].isIn(y.variable)) {
			if (!(
				   ((yp < state[y.type].length-1) && state[x.type][yp+1].isIn(x.variable))
				   || ((yp > 0) && state[x.type][yp-1].isIn(x.variable))
				)
			) {
				state[y.type][yp].not_unify(y.variable);
				change = true;
			}
		}
	}
	
	return change;
};

function variableToString (v) {
	var str = "";
	if (v.get_value()) {
		str = v.get_value();
	}
	else {
		var values = v.getValues();
		var v_values = [];

		values.forEach (function (x) {
			v_values.push(x.getValue());
		});
	
		v_values.sort();

		v_values.forEach (function (x) {
			str += x + " ";
		});
		
		str = "[" + str + "]";
	}
	
	return str;
};

/*
function toString (state) {
	var str = "";
	for (var t in state) {
		str += t + ": ";
		state[t].forEach(function (v) {
			str += variableToString(v) + " ";
		});
		str += "\n";
	};

	return str;
}
*/ 

function tryValues (state) {
	var change = false;
	for (var t in state) {
		state[t].forEach (function (v) {
			v.tryValues();
		});
	}
};

/* ==========================
 *   Save and Load state,
 * ========================== 
 */
function saveState (state) {
	for (var t in state) {
		state[t].forEach (function (e) {
			e.save();
		});
	}
};

function loadState (state) {
	for (var t in state) {
		state[t].forEach (function (e) {
			e.load();
		});
	}
};


/* ==========================
 *   Count state values
 * ==========================
 */
function countValues (state) {
	var c = 0;
	for (var t in state) {
		state[t].forEach (function (e) {
			c += e.getValues().length;
		});
	}
	
	return c;
};


function tryConstrain (state, c, saved, save) {
	!save && saveState(state);
	var change = false;
	
	while (c.constrain(c.x, c.y, state)) {
		saved.forEach (function (c) {
			tryConstrain(state, c, [], true);
		});
		change=true;
	}

	change && tryValues(state);
	
	var count = countValues(state);
	
	!save && loadState(state);

	return {
		constrain: c,
		count: count
	};
};

// =====

/*
function constrainToString (c) {
	var str = "";
	if (c.type === "middle") {
		str += "The "+ c.x.variable.getValue()+ " is in the middle.";
	}
	else {
		str += "The "+ c.x.variable.getValue()+ " is " + c.type + " " + c.y.variable.getValue();
	}
	
	return str;
}
*/

function tryConstrains (state, saved, stats, constrains) {
	var result = [];
	constrains.forEach (function (c) {
		result.push(tryConstrain(state, c, saved));
	});
	
	result.sort(function (a, b) {
		return a.count - b.count;
	});
	
	var r = [];
	var max = result[0].count;
	result.forEach (function (e) {
		if (max === e.count) {
			r.push(e);
		}
	});
	
	r.sort(function (a, b) {
		var ca = (stats.actions[a.constrain.type] || 0)
			+ (stats.values[a.constrain.x.variable.getValue()] || 0)
			
		if (a.constrain.y) {
			ca += stats.values[a.constrain.y.variable.getValue()] || 0;
		}
		
		var cb = (stats.actions[b.constrain.type] || 0)
			+ (stats.values[b.constrain.x.variable.getValue()] || 0)
			
		if (b.constrain.y) {
			cb += stats.values[b.constrain.y.variable.getValue()] || 0;
		}
		
		return cb - ca;
	});
	
	return r.reverse();
};


/*
function printConstrains (constrains) {
	console.log("Total: " + constrains.length);
	constrains.forEach (function (c) {
		if (c.type === "middle") {
			console.log("The "+ c.x.variable.getValue()+ " is in the middle.");
		}
		else {
			console.log("The "+ c.x.variable.getValue()+ " is " + c.type + " " + c.y.variable.getValue());				
		}
	});
}
*/

/*
function paths (state, constrains, res) {
	res = res || [];
	var change = false;
	
	constrains.forEach(function (c) {
		if (c.constrain(c.x, c.y, state)) {
			if (c.type === "middle") {
				console.log("The "+ c.x.variable.getValue()+ " is in the middle.");
			}
			else {
				console.log("The "+ c.x.variable.getValue()+ " is " + c.type + " " + c.y.variable.getValue());				
			}
			
			console.log(toString(state));
			
			if (res.indexOf(c) === -1) {
				res.push(c);
			}
			tryValues(state);
			console.log("Try values:");
			console.log(toString(state));
			
			change = true;
		}
	});
	
	change && paths(state, shuffle(constrains), res);

	return res;
};
*/


/*
 * Lib Code.
 */ 

function getConstrains (state, constrains) {
	var result = [];
	var count = 0;
	var stats = {
		actions: {},
		values: {}
	};	

	for (var t in state) {
		state[t].forEach (function (e) {
			e.getValues().forEach(function (x) {
				stats["values"][x.getValue()] = 0;
			});
		});
	}
	
	while (count!==5*5) {
		result.forEach (function (c) {
			tryConstrain(state, c, result, true);
		});

		var cs = tryConstrains(state, result, stats, constrains);
		
		stats["actions"][cs[0].constrain.type] = stats["actions"][cs[0].constrain.type] || 0;
		stats["actions"][cs[0].constrain.type]++;
		
		stats["values"][cs[0].constrain.x.variable.getValue()]++;
		
		if (cs[0].constrain.y) {
			stats["values"][cs[0].constrain.y.variable.getValue()]++;
		}
		
		constrains.splice(constrains.indexOf(cs[0].constrain), 1);
		result.push(cs[0].constrain);
		count = cs[0].count;
	}

	result.forEach (function (c) {
		tryConstrain(state, c, result, true);
	});
	
	var missing = [];
	for (var i in stats["values"]) {
		if (stats["values"][i] === 0) {
			missing.push(i);
		}
	}

	var r = {constrains: [], missing: missing, solution: {}};

	shuffle(result).forEach (function (c) {
		r.constrains.push({
				type: c.type,
				x: c.x.variable.getValue(),
				y: c.y?c.y.variable.getValue():null
		});
	});
	
	for (var t in state) {
		if (!r.solution[t]) {
			r.solution[t] = [];
		}
		
		state[t].forEach (function (e) {
			r.solution[t].push(variableToString(e));
		});
	};
	
	return r;
}


function gen (n) {
	var r = [];
	n = n || 1;
		
	while(n--) {
		var c = constrains();
		var state = initState();

		r.push(getConstrains(state, c.constrains));
		
		console.log("Generated: " + r.length);
	}

	return r;
};

exports.gen = gen;




