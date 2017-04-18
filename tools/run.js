#!/usr/bin/env node

var Z = require("../lib/z");
var fs = require("fs");


function run (filename) {
    var run = new Z();
    fs.readFile(filename, function (err, data) {
        if (err) {
            console.log(err);
        }
        else {
            try {
               console.log(run.print(data.toString())); 
            }
            catch (e) {
                console.log(e);
            }
        }
    });
}

if (process.argv.length === 3) {
    run(process.argv[2]);
}
else {
    console.log(process.argv[1] + " <filename>");
}

