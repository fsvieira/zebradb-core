var puzzles = require("./puzzleslib");
var fs = require("fs");


//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

function replace(original, replace, clues) {
	clues.forEach (function (clue) {
		if (clue.a.v === original) {
			clue.a.v = replace;
		}
		
		if (clue.b && (clue.b.v === original)) {
			clue.b.v = replace;
		}
	});
};

function genGrid (w, h) {
	var result = [];
	for (var y=0; y<h; y++) {
		var vars = [];
		for (var x=0; x<w; x++) {
			vars.push("var"+ y+"_"+ x);
		}
		result[y] = shuffle(vars);
	}
	
	return result;
	
};

function getPuzzle (grid, clues) {
	var solution = genGrid(grid.w, grid.h);

	solution.forEach (function (line, y) {
		line.forEach (function (v, x) {
			replace("tvar"+y+"_"+x, v, clues);
		});
	});
	
	// random next clue,
	clues.forEach (function (clue) {
		if (clue.type === 'next to') {
			var coin = Math.random() >= 0.5;
			
			var a = clue.a;
			var b = clue.b;
			
			clue.a = coin?a:b;
			clue.b = coin?b:a;
		};
	});
	
	return {solution:solution, clues: clues};
};


function genPuzzles (filename) {
	var template = puzzles.getJSON("templates/"+filename);
	var grid = template.grid;

	console.log("=== Puzzle " + grid.w + "x" + grid.h + " ===");

	template.solutions.forEach (function (clues, index) {
		template.solutions[index] = getPuzzle(grid, clues);
	});
	
	shuffle(template.solutions);
	
	fs.writeFileSync("puzzles/" + filename.replace("template", "puzzles"), JSON.stringify(template));
}

genPuzzles("template-2x2.json");
genPuzzles("template-3x2.json");
genPuzzles("template-3x3.json");
genPuzzles("template-4x4.json");
genPuzzles("template-5x5.json");
genPuzzles("template-4x4.json");


