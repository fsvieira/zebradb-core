#!/usr/bin/env node

var fs = require("fs");
var ZQuery = require("../lib/zquery");

var data = "";
for (var i=2; i<process.argv.length; i++) {
    var file = process.argv[i];
    data += fs.readFileSync(file) + "\n";
    console.log(file);        
};

var run = new ZQuery.Run(data);

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
          
          if (cmd.search(/query /i) === 0) {
              console.log("QUERY: " + cmd.substring(6).trim())
              console.log(run.queryArray(cmd.substring(6).trim(), 10));
          }
          else {
              console.log(cmd);
          }
          
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