var v = require("../../lib/variable").v;
var genetic = require("../../lib/genetic").find;

var fs = require("fs");

var puzzles = require("./puzzleslib");

/*
 * check solution functions,
 */
function countValues (state) {
	var count = 0;
	state.forEach (function (line) {
		line.forEach (function (item) {
			count += item?1:0;
		});
	});

	return count;
};

function fillState (grid, clues) {
	// gen init state (empty state). 
	var state = [];
	for (var y=0; y<grid.h; y++) {
		for (var x=0; x<grid.h; x++) {
			state[y] = state[y] || [];
			state[y][x] = undefined; 
		}
	}

	clues.forEach (function (clue) {
		var x = clue.a.x.getValue();
		if (x!==undefined) {
			state[clue.a.y][x]=clue.a.v;
		}
		
		if (clue.b && (x = clue.b.x.getValue())!==undefined) {
			state[clue.b.y][x]=clue.b.v;
		}
	});
	
	return countValues(state);
};


/*
 * Save and load vars,
 */
/*
function saveAndLoad () {
	var stack = [];

	function save (vars) {
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
*/

function getSaveClues (grid, find) {
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


function getSaveDebug (grid, find) {
	var filename = "debug/debug-"+ grid.w + "x" + grid.h + ".json";
	console.log("Debug Puzzles are going to be saved to " + filename);
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

function gen (w, h, size, max) {
	/*var sl = saveAndLoad();
	var save = sl.save;
	var load = sl.load;*/

	var grid = puzzles.genGrid (w, h);
	var saveClues = getSaveClues (grid, max);
	var debugClues = getSaveDebug (grid, max);

	function test (clues) {
		var stats = puzzles.solve2(grid, clues);

		return {
			count: stats.vcount,
			sol: stats.solution,
		};
	};

	var solutions = genetic(grid.constrains, size, test, max, saveClues, debugClues);
	
	// toJson (grid.constrains);

	return solutions;
};

// gen(2,2,2,1);
// gen(3,2,4,1);
// gen(3,3,6,1); 
// gen(4,4,11,1);
// gen(4,4,11,1);

// gen (5, 5, 25, 1);
// gen (5, 5, 19, 2);
// gen (5, 5, 18, 2);
gen (5, 5, 17, 1);
// gen (5, 5, 16, 1);
// gen(4,4,10,1);




