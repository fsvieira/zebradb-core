var fs = require("fs");
var v = require("../../lib/variable").v;

function getJSON (filename) {
	var template = JSON.parse(fs.readFileSync(filename));
	return template;
};

// TODO: use same code to generate puzzles.
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
		
		a.x.change (function (b) {
			return function (a) {
				var da = a.getValues();
				var db = b.getValues();
						
				da.forEach (function (x) {
					if (
						(db.indexOf(x+1) === -1)
						&& (db.indexOf(x-1) === -1)
					) {
						a.setNoValue(x);
					}
				});
			};
		}(b.x));
				
		b.x.change (function (a) {
			return function (b) {
				var da = a.getValues();
				var db = b.getValues();
						
				db.forEach (function (x) {
					if (
						(da.indexOf(x-1) === -1)
						&& (da.indexOf(x+1) === -1)
					) {
						b.setNoValue(x);
					}
				});
			};
		}(a.x));
		
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
		
		a.x.change (function (b) {
			return function (a) {
				var da = a.getValues();
				var db = b.getValues();

				da.forEach (function (x) {
					if (db.indexOf(x+1) === -1) {
						a.setNoValue(x);
					}
				});
			};
		}(b.x));
				
		b.x.change (function (a) {
			return function (b) {
				var da = a.getValues();
				var db = b.getValues();
						
				db.forEach (function (x) {
					if (da.indexOf(x-1) === -1) {
						b.setNoValue(x);
					}
				});
			};
		}(a.x));
	},
	"same position as": function (grid, a, b) {
		var domain = [];
		for (var i=0; i<grid.w; i++) {
			domain.push(i);
		}

		a.x = v({domain:domain});
		b.x = v({domain:domain});
		
		a.x.change (function (b) {
			return function (a) {
				var da = a.getValues();
				var db = b.getValues();
								
				da.forEach (function (x) {
					if (db.indexOf(x) === -1) {
						a.setNoValue(x);
					}
				});
			};
		}(b.x));
						
		b.x.change (function (a) {
			return function (b) {
				var da = a.getValues();
				var db = b.getValues();
								
				db.forEach (function (x) {
					if (da.indexOf(x) === -1) {
						b.setNoValue(x);
					}
				});
			};
		}(a.x));
	}
};


function setClueVars (grid, clues) {
	clues.forEach (function (clue) {
		constrains[clue.type](grid, clue.a, clue.b);
	});
	
	function setVars (a, b) {
		if ((a && b) && (a.v!==b.v) && (a.y===b.y)){
			a.x.not_unify(b.x);
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

function saveAndLoad (vars) {
	var stack = [];

	function save () {
		var save = [];
		var check = [];
		vars.forEach (function (v) {
			if (check.indexOf(v.share) === -1){
				save.push(v.cloneShare());
			}
		});
		
		stack.push(save);
	}

	function load () {
		var load = stack.pop();
		load.forEach (function (share) {
			share.equal.forEach(function (v) {
				v.share = share;
			});
		});
	};

	return {load: load, save: save};
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
	
	return count;
};

function solve (grid, clues) {
	var icount = countItems(clues);

	if (icount === grid.w*grid.h) {
		var items = {}, vars;

		setClueVars(grid, clues);
		vars = getVars(clues);
		console.log("=== start === ");
		showState(grid, clues);

		var sl = saveAndLoad(vars);
		
		clues.forEach (function (clue, index) {
			clueToString(clue, index);
			
			items[clue.a.v] = items[clue.a.v] || clue.a.x;
			items[clue.a.v].unify(clue.a.x);
			if (clue.b) {
				items[clue.b.v] = items[clue.b.v] || clue.b.x;	
				items[clue.b.v].unify(clue.b.x);
			}
		});

		vars.forEach (function (v) {
			v.tryValues(sl);
		});
		
		var valuesCount = countVarValues (vars);

		console.log("=== Solution ===");
		showState(grid, clues);

		clues.forEach (function (clue, index) {
			clueToString(clue, index);
		});
		
		console.log(valuesCount);
		
		console.log("=== Solution End ===");

		var stateDebug = fillState(grid, clues);
		var count = countValues(stateDebug.state);

		return {items: icount, vcount: valuesCount, count: count, solution: (count === grid.w*grid.h), debug: stateDebug.debug};
	}
	

	return {items: icount, vcount: 0, count: 0, solution: false, debug: false};

};

exports.getJSON = getJSON;
exports.setClueVars = setClueVars;
exports.solve = solve;
exports.getVars = getVars;
exports.cluesToString = cluesToString;

