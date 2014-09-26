var Variable = require("../../lib/variable");
var backtrack = require("../../lib/backtrack");

var puzzle = [
	0, 0, 0,  7, 0, 0,  0, 0, 0,
	1, 0, 0,  0, 0, 0,  0, 0, 0,
	0, 0, 0,  4, 3, 0,  2, 0, 0,
	
	0, 0, 0,  0, 0, 0,  0, 0, 6,
	0, 0, 0,  5, 0, 9,  0, 0, 0,
	0, 0, 0,  0, 0, 0,  4, 1, 8,
	
	0, 0, 0,  0, 8, 1,  0, 0, 0,
	0, 0, 2,  0, 0, 0,  0, 5, 0,
	0, 4, 0,  0, 0, 0,  3, 0, 0,
];

/*
[2] [6] [4] [7] [1] [5] [8] [3] [9] 
[1] [3] [7] [8] [9] [2] [6] [4] [5] 
[5] [9] [8] [4] [3] [6] [2] [7] [1] 
[4] [2] [3] [1] [7] [8] [5] [9] [6] 
[8] [1] [6] [5] [4] [9] [7] [2] [3] 
[7] [5] [9] [6] [2] [3] [4] [1] [8] 
[3] [7] [5] [2] [8] [1] [9] [6] [4] 
[9] [8] [2] [3] [6] [4] [1] [5] [7] 
[6] [4] [1] [9] [5] [7] [3] [8] [2] 
*/

var factory = new Variable();

function setupPuzzle (puzzle) {
	var v = factory.v;
	
	// create variables,
	var solution = {
		rows: {},
		cols: {},
		squares: {},
		all: [],
	};
	
	puzzle.forEach (function (value, index) {
		var p = v(value?{domain: [value]}:{domain: [1, 2, 3, 4, 5, 6, 7, 8, 9]});
		var y = Math.floor(index/9);
		var x = index - y*9;
		var squareOffset = Math.floor(x/3) + Math.floor(y/3)*3 ;
		
		solution.all.push(p);
		(solution.rows[y] = (solution.rows[y] || [])).push(p);
		(solution.cols[x] = (solution.cols[x] || [])).push(p);
		(solution.squares[squareOffset] = (solution.squares[squareOffset] || [])).push(p);
		
	});

	function distinct (groups) {
		for (var g in groups) {
			var vars = groups[g];

			// mk all vars in this group distinct,
			for (var i=0; i!==vars.length; i++) {
				var a = vars[i];
				for (var j=i+1; j!==vars.length; j++) {
					var b = vars[j];
					a.notUnify(b);
				}
			}
		}
	}
	
	distinct(solution.rows);
	distinct(solution.cols);
	distinct(solution.squares);
	
	return solution.all;
}

function print(solution) {
	var s = "";
	solution.forEach (function (v, i) {
		s +="[" + v.getValues() + "]" + (((i+1)%9)?" ":"\n");
	});
	
	console.log(s);
}


var solution = setupPuzzle(puzzle);
backtrack(factory, print);

