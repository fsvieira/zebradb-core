var zebra = require("./zebra");
var fs = require("fs");

var z = zebra.gen(5);
filename = "puzzles-"+ (new Date()).toISOString() +".json";
fs.writeFileSync(filename, JSON.stringify(z));
console.log("New puzzles saved to " + filename);
