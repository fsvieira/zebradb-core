#!/usr/bin/env node

var Z = require("../lib/z");
var utils = require("../lib/utils");

function print (query, result) {
  console.log("Query: " + utils.toString(query));
  for (var i=0; i<result.length; i++) {
    console.log("\t" + (i+1) + ". " + utils.toString(result[i]));
  }
}

var maxLen = 2000;

if (process.argv.length > 2) {
  var zfile = process.argv[2];
  var run = new Z.Run();
  run.add("["+zfile+"]", print , maxLen);
}
else {
  var run = new Z.Run([]);
  
  var readline = require('readline'),
      rl = readline.createInterface(process.stdin, process.stdout);
  
  rl.setPrompt('[[ZEBRA]]|> ');
  rl.prompt();
  
  var cmd = "";
  
  rl.on('line', function(line) {
    line = line.trim();
    if (line.length > 0) {
        if (line[line.length-1] === ";") {
            cmd += line.substring(0, line.length-1);
            run.add(cmd, print, maxLen);
            cmd = "";
        }
        else {
            cmd += line + "\n";
        }
    }
  
    rl.prompt();
  }).on('close', function() {
    console.log('Have a great day!');
    process.exit(0);
  });
}