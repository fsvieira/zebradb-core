var fs = require("fs");
var Variable = require("../../lib/variable");
var backtrack = require("../../lib/backtrack");

var factory = new Variable();
var v = factory.v;

function getJSON (filename) {
	var template = JSON.parse(fs.readFileSync(filename));
	return template;
};

/* ===============
 * 	  Gen grid
 * 
 * - Note: Solution items order doesnt matter since random solutions 
 *   can be generated by item replacement.
 * ===============
 */
function genGrid (cols, lines, prefix) {
	prefix = prefix || "tvar";
	
	var r = {
		solution: [],
		posy: {},
		w: cols,
		h: lines
	};
	
	for (var y=0; y<lines; y++) {
		var vars = [];
		var domain = [];
		var strVars = [];
		for (var x=0; x<cols; x++) {
			var id = prefix + y+ "_" +x;
			domain.push(id);
			r.posy[id] = y;
		}
		r.solution.push (domain);
	}
	
	r.constrains = getConstrains(r);
	
	return r;
};

/* ===============
 * 		Get all possible constrains
 * 
 * - Returns a list of all possible constrains that can be applyed to grid.
 * ===============
 */
function getConstrains (grid) {
	var constrains = [];
	var solution = grid.solution;
	
	function getVar (yA, vA) {
		return {
			y: yA,
			v: vA
		};
	};
	
	function getClue (typeA, a, b) {
		var clue = {
			type: typeA,
			a: a,
		};
		
		if (b) {clue.b = b;}
		
		return clue;
	};

	// Gen "item" clues,
	for (var y=0; y<grid.h; y++) {
		for (var x=1; x < grid.w; x++) {
			var a = getVar(y, solution[y][x]);
			constrains.push(getClue("item", a));
		}
	}
	
	// Gen "middle" clues,
	for (var y=0; y<grid.h; y++) {
		for (var x=1; x < grid.w-1; x++) {
			var a = getVar(y, solution[y][x]);
			constrains.push(getClue("middle", a));
		}
	}
	
	// Gen "immediately to the left of" and "next to" clues,
	for (var x=0; x < grid.w-1; x++) {
		for (var y=0; y<grid.h; y++) {
			for (var y2=0; y2<grid.h; y2++) {
				// immediately to the left of,
				var a = getVar(y, solution[y][x]);
				var b = getVar(y2, solution[y2][x+1]);
				var clue = getClue("immediately to the left of", a, b);
				constrains.push(clue);
				
				// next to,
				var a = getVar(y, solution[y][x]);
				var b = getVar(y2, solution[y2][x+1]);
				var clue = getClue("next to", a, b);
				
				constrains.push(clue);
			}
		}
	}

	// Gen "same position as" clues,
	for (var x=0; x < grid.w; x++) {
		for (var y=0; y<grid.h; y++) {
			for (var y2=y+1; y2<grid.h; y2++) {
				var a = getVar(y, solution[y][x]);
				var b = getVar(y2, solution[y2][x]);
				var clue = getClue("same position as", a, b);
				
				constrains.push(clue);
			}
		}
	}
	
	return constrains;
};

function getSaveClues (grid) {
	var filename = "templates/template-"+ grid.w + "x" + grid.h + ".json";
	console.log("Puzzles are going to be saved to " + filename);
	var solutions = [];

	try {
		solutions = JSON.parse(fs.readFileSync (filename)).solutions; // , function (err, data) {
	}
	catch (e) {
		solutions = [];
	}

	return function (clues) {
		var r = [];
		
		clues.forEach (function (clue) {
			if (clue.b) {
				r.push({
					type: clue.type,
					a: {
						v: clue.a.v,
						y: clue.a.y
					},
					b: {
						v: clue.b.v,
						y: clue.b.y
					}
				});
			}
			else {
				r.push({
					type: clue.type,
					a: {
						v: clue.a.v,
						y: clue.a.y
					}
				});
			}
		});
		
		
		solutions.push(r);
		console.log("Save Solution: " + solutions.length);
		console.log(JSON.stringify(r));

		var w = {
			grid: {
				w: grid.w,
				h: grid.h
			},
			solutions: solutions
		};
		
		fs.writeFileSync(filename, JSON.stringify(w));
	};

};

var constrains = {
	"item": function (grid, a) {
		var domain = [];
		for (var i=0; i<grid.w; i++) {
			domain.push(i);
		}

		a.x = v({domain:domain});
	},
	"next to": function (grid, a, b) {
		var domain = [];
		for (var i=0; i<grid.w; i++) {
			domain.push(i);
		}
	
		a.x = v({domain:domain});
		b.x = v({domain:domain});
		
		b.x.ondomain (function (a) {
			return function (b) {
				var da = a.getValues();
				var db = b.getValues();
				var ok = true;
				
				da.forEach (function (x) {
					if (
						(db.indexOf(x+1) === -1)
						&& (db.indexOf(x-1) === -1)
					) {
						ok = ok && a.setNoValue(x);
					}
				});
				
				return ok;
			};
		}(a.x));
				
		a.x.ondomain (function (b) {
			return function (a) {
				var da = a.getValues();
				var db = b.getValues();
				var ok = true;
						
				db.forEach (function (x) {
					if (
						(da.indexOf(x-1) === -1)
						&& (da.indexOf(x+1) === -1)
					) {
						ok = ok && b.setNoValue(x);
					}
				});
				
				return ok;
			};
		}(b.x));
		
	},
	"middle": function (grid, a) {
		var domain = [];
		for (var i=1; i<grid.w-1; i++) {
			domain.push(i);
		}

		a.x = v({domain:domain});
		
		
	},
	"immediately to the left of": function (grid, a, b) {
		var domain = [];
		for (var i=0; i<grid.w-1; i++) {
			domain.push(i);
		}

		a.x = v({domain:domain});
		
		var domain = [];
		for (var i=1; i<grid.w; i++) {
			domain.push(i);
		}
		
		b.x = v({domain:domain});
		
		b.x.ondomain (function (a) {
			return function (b) {
				var da = a.getValues();
				var db = b.getValues();
				var ok = true;
				da.forEach (function (x) {
					if (db.indexOf(x+1) === -1) {
						ok = ok && a.setNoValue(x);
					}
				});
				
				return ok;
			};
		}(a.x));
				
		a.x.ondomain (function (b) {
			return function (a) {
				var da = a.getValues();
				var db = b.getValues();
				var ok = true;
				
				db.forEach (function (x) {
					if (da.indexOf(x-1) === -1) {
						ok = ok && b.setNoValue(x);
					}
				});
				
				return ok;
			};
		}(b.x));
	},
	"same position as": function (grid, a, b) {
		var domain = [];
		for (var i=0; i<grid.w; i++) {
			domain.push(i);
		}

		a.x = v({domain:domain});
		b.x = v({domain:domain});
		
		b.x.ondomain (function (a) {
			return function (b) {
				var da = a.getValues();
				var db = b.getValues();
				var ok = true;
								
				da.forEach (function (x) {
					if (db.indexOf(x) === -1) {
						ok = ok && a.setNoValue(x);
					}
				});
				
				return ok;
			};
		}(a.x));
						
		a.x.ondomain (function (b) {
			return function (a) {
				var da = a.getValues();
				var db = b.getValues();
				var ok = true;
								
				db.forEach (function (x) {
					if (da.indexOf(x) === -1) {
						ok = ok && b.setNoValue(x);
					}
				});
				
				return ok;
			};
		}(b.x));
	}
};


function setClueVars (grid, clues) {
	clues.forEach (function (clue) {
		constrains[clue.type](grid, clue.a, clue.b);
		var a = clue.a;
		var b = clue.b;
	});
	
	function setVars (a, b) {
		if ((a && b) && (a.v!==b.v) && (a.y===b.y)){
			a.x.notUnify(b.x);
		}
	};

	for (var i=0; i<clues.length-1; i++) {
		var clue1 = clues[i];
		for (var j=i+1; j<clues.length; j++) {
			var clue2 = clues[j];
			setVars(clue1.a, clue2.a);
			setVars(clue1.a, clue2.b);
			setVars(clue1.b, clue2.a);
			setVars(clue1.b, clue2.b);
		}
	}
};


function fillState (grid, clues) {
	// gen init state (empty state). 
	var state = [];
	var debug = false;
	
	for (var y=0; y<grid.h; y++) {
		for (var x=0; x<grid.w; x++) {
			state[y] = state[y] || [];
			state[y][x] = undefined; 
		}
	}

	clues.forEach (function (clue) {
		var x = clue.a.x.getValue();
		if (x!==undefined) {
			if (state[clue.a.y][x] && (state[clue.a.y][x]!==clue.a.v)) {
				console.log("BUG: conflicting vars, " + state[clue.a.y][x] + ", " + clue.a.v);
				debug = true;
			}
			state[clue.a.y][x]=clue.a.v;
		}
		
		if (clue.b && (x = clue.b.x.getValue())!==undefined) {
			if (state[clue.b.y][x] && (state[clue.b.y][x]!==clue.b.v)) {
				debug = true;
				console.log("BUG: conflicting vars, " + state[clue.b.y][x] + ", " + clue.b.v);
			}
			
			state[clue.b.y][x]=clue.b.v;
		}
	});
	
	return {state: state, debug: debug};
};

function stateToString (state) {
	var r = "";
	state.forEach (function (line) {
		var l = "";
		line.forEach (function (v) {
			l += v + " ";
		});
		
		r += l + "\n";
	});
	
	return r;
};

function getVars (clues) {
	var vars = [];
	
	clues.forEach (function (clue) {
		vars.push(clue.a.x);
		if (clue.b) {
			vars.push(clue.b.x);
		}
	});
	
	return vars;
};


function countItems (clues) {
	var items = [];
	clues.forEach (function (clue) {
		if (items.indexOf(clue.a.v) === -1) {
			items.push(clue.a.v);
		}
		
		if (clue.b && (items.indexOf(clue.b.v) === -1)) {
			items.push(clue.b.v);
		}
	});
	
	return items.length;
};



function clueToString (clue, index) {
	var r = "Clue " + index + " " + clue.type +": (" + clue.a.v + (clue.a.x? ", [" + clue.a.x.getValues() + "], ":", ") + clue.a.y + ")";
	if (clue.b) {
		r += " (" + clue.b.v + (clue.b.x?", [" + clue.b.x.getValues() + "], ":", ") + clue.b.y + ")";	
	}		
	r+="\n";
	
	return r;
};

function cluesToString (clues) {
	var r = "";
	clues.forEach (function (clue, index) {
		r += clueToString(clue, index);		
	});
	
	return r;
};

function showState (grid, clues) {
	var vars = getVars(clues);
	var stateDebug = fillState(grid, clues);
	
	console.log(stateToString(stateDebug.state));

	var count = countValues(stateDebug.state);

	if (count === grid.w*grid.h) {
		console.log("Solution found");
	}
	
	console.log(cluesToString(clues));

};

function countValues (state) {
	var count = 0;
	state.forEach (function (line) {
		line.forEach (function (item) {
			count += item?1:0;
		});
	});

	return count;
};

function countVarValues (vars) {
	var count = 0;

	vars.forEach (function (v) {
		count += v.getValues().length;
	});
	
	return count - vars.length;
};

function stats (clues, grid) {
	var cpos = 0; 
	var cvars = 0;
	var vars = [];
	
	clues.forEach (function (clue) {
		cpos += clue.a.x.getValues().length;
		cvars++;
		
		if (vars.indexOf(clue.a.v) === -1) {
			vars.push(clue.a.v);
		}
		
		if (clue.b) {
			cpos += clue.b.x.getValues().length;
			cvars++;
			if (vars.indexOf(clue.b.v) === -1) {
				vars.push(clue.b.v);
			}
		}
	});
	
	var avg = (grid.w + 1) - (cpos / cvars);
	var p = (vars.length*avg) / (grid.w*grid.h*grid.w);

	return p;
};


function solve (grid, clues) {
	var items = {}, vars;

	setClueVars(grid, clues);

	vars = getVars(clues);
	var valuesCountStart = countVarValues (vars);
	
	clues.forEach (function (clue, index) {
		clueToString(clue, index);
			
		items[clue.a.v] = items[clue.a.v] || clue.a.x;
		items[clue.a.v].unify(clue.a.x);
		
		if (clue.b) {
			items[clue.b.v] = items[clue.b.v] || clue.b.x;	
			items[clue.b.v].unify(clue.b.x);
		}
	});

	// TODO: try to find early solution, cut list on there.

	if (countVarValues (vars) > grid.w*grid.h) {
		factory.tryValues(); // TODO: change this to backtrack, check if is able to find a solution with only the tested vars.
	}

	var valuesCountEnd = countVarValues (vars);

	console.log("=== Solution ===");
	showState(grid, clues);

	clues.forEach (function (clue, index) {
		clueToString(clue, index);
	});
		
	console.log("=== Solution End ===");

	var stateDebug = fillState(grid, clues);
	var count = countValues(stateDebug.state);

	var vcount = stats(clues, grid);

	return {vcount: vcount, solution: (count === grid.w*grid.h)};
};

exports.getJSON = getJSON;
exports.setClueVars = setClueVars;
exports.solve = solve;

exports.genGrid = genGrid;

exports.getVars = getVars;
exports.cluesToString = cluesToString;

