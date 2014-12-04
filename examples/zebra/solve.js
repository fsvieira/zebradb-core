var puzzles = require("./puzzleslib");

function solve (filename, index) {
	var p = puzzles.getJSON(filename);
	
	var clues = p.solutions[index];
	var puzzle = {};
	puzzle.clues = clues.clues || clues;

	puzzles.solve2(p.grid, puzzle.clues, function (state) {
		console.log("-- solution found --");
		console.log(state);
	});
};

solve("puzzles/puzzles-5x5.json", 0);
solve("templates/template-5x5.json", 0);
// solve("templates/template-2x2.json", 0);
// solve("debug/debug-3x3.json", 0);



