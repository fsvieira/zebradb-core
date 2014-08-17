// var v = require("../../lib/variable").v;
// var fs = require("fs");
var puzzles = require("./puzzleslib");

function solve (filename, index) {
	var p = puzzles.getJSON(filename);
	
	var clues = p.solutions[index];
	var puzzle = {};
	puzzle.clues = clues.clues || clues;
	// puzzles.setClueVars (p.grid, puzzle.clues);
	
	// console.log(puzzle);
	puzzles.solve(p.grid, puzzle.clues);
};

solve("puzzles/puzzles-5x5.json", 2);
// solve("debug/debug-3x3.json", 0);



