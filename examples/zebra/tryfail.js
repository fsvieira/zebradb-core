var puzzles = require("./puzzleslib");
var fs = require("fs");

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};


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


function tryfail (w, h, max) {
	
	var grid = puzzles.genGrid(w, h);
	var clues = grid.constrains.slice(0);
	var l; 
	
	do {
		l = clues.length; 
		shuffle(clues);
	
		for (var i=0; i<clues.length; i++) {
			var cs = clues.slice(0);
			
			cs.splice(i, 1);
			
			var r = puzzles.solve(grid, cs);
			
			if (r.solution) {
				console.log("FOUND SOLUTION!! ==> " + cs.length);
				clues = cs;
				break;
			}
		}
		
		console.log(l + "%");
	} while (l > clues.length);
	
	console.log("==> " + clues.length);
	
	var r = puzzles.solve(grid, clues);
	console.log(r);
	
	return clues;
	 
};

function gen(w, h, n, max) {
	var save = getSaveClues({w: w, h: h});
	
	while (n>0) {
		var clues = tryfail(w,h);
		
		if (max === undefined) {
			save(clues);
			n--;
		}
		else if (clues.length < max) {
			save(clues);
			n--;
		}
	}
}

gen(5,6,10);

// gen(5,5,10, 18);
// gen(6,6,10);
// gen(7,7,10);


