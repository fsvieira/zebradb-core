var puzzles = require("./puzzleslib");


function combinations (remainder, clues, f) {
	f (clues);
	remainder.forEach (function (clue, index) {
		var c = clues.slice(0);	
		c.push(clue);
		
		combinations(remainder.slice(index+1), c, f);
	});
}

function concat (a, b) {
	var r = a.slice(0);
	b.forEach (function (x) {
		r.push(x);
	});
	
	return r;
};

function iterator (clues, f) {
	return function (a) {
		combinations(clues, [], function (b) {
			var r = concat(a, b);
			f(r);
		});
	};
};

function gen (w, h) {
	
	var grid = puzzles.genGrid(w, h);
	
	var vars = {};
	var clues = [];
	
	grid.constrains.forEach (function (clue) {
		var c = vars[clue.a.v] || [];
		vars[clue.a.v] = c;
		vars[clue.a.v].push(clue);
		
		/*if (clue.b) {
			vars[clue.b.v] = vars[clue.b.v] || [];
			vars[clue.b.v].push(clue);
		}*/
	});
	
	for (var v in vars) {
		clues.push(vars[v]);
	}
	
	clues.sort(function (a, b) {
		return a.length - b.length;
	});
	
	var f = function (r) {
		// console.log(r);
		var s = puzzles.solve2(grid, r);
		
		console.log(s.vcount + "%, solution=" + s.solution);
		
		if (s.solution) {
			process.exit(0);
		}
	};
	
	clues.forEach (function (cs, index) {
		f = iterator (cs, f);
	});
	
	f([]);
	
	/*
	var f1 = iterator (clues[0], f);
	var f2 = iterator (clues[1], f1);
	
	f2([]);*/
	
	/*combinations(clues[0], [], function (a) {
		combinations(clues[1], [], function (b) {
			console.log("====");
			var r = concat(a, b);
			console.log(r);
		});
	});*/
};

gen (5, 5);
