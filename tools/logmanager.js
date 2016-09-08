#!/usr/bin/env node

var fs = require("fs");
var readline = require('readline');
var program = require('commander');
var crypto = require('crypto');


var warns = {
    "writer": {
        "union": function () {
            return 1;
        }
    }
};


function diet (json) {
    if (typeof json === 'object') {
        for (var i in json) {
            if (i === 'virtual') {
                delete json.virtual;
            }
            else {
                diet(json[i]);
            }
        }
    }
}

function warning (json, stats) {
    var warn = warns[json.type.class]?warns[json.type.class][json.type.fn]:undefined;
    
    var key = json.type.class + "." + json.type.fn;
    stats.types[key] = (stats.types[key] || 0) + 1;
    
    return warn?warn(json):0;
}

function writeTest (json) {
    diet(json);
    
    var str = "var p = writer.load("+JSON.stringify(json.self)+");\n" +
              "var q = writer.load("+JSON.stringify(json.args[0])+");\n" + 
              "should(p.union(q).snapshot()).eql(\n\t" + JSON.stringify(json.result.value) + "\n);";
              
    console.log(str);
}

function unifyTest (json) {
    diet(json);
    var str = "var p = writer.load(\n\t" + JSON.stringify(json.args[0]) + "\n);\n" +
              "should(unify."+ json.type.fn +"(p, " + json.args[1] + ", " + json.args[2] + ")).eql(\n\t" + json.result.value + "\n);\n";
              
    if (json.result.args && json.result.args[0]) {
        str += "should(p).eql(\n\t" + JSON.stringify(json.result.args[0]) + "\n);";
    }

    console.log(str);
}

function genTest (json) {
    switch (json.type.class) {
        case 'unify':
            unifyTest(json);
            break;
            
        case 'write':
            writeTest(json);
            break;
    }
}

function main () {

    program
        .version('0.0.1')
        .option('-i, --input <filename>', 'Input log file')
        .parse(process.argv);
        
    var hashs = [];

    if (program.input) {
        console.log("Reading file: " + program.input);

        var rd = readline.createInterface({
            input: fs.createReadStream(program.input),
            output: process.stdout,
            terminal: false
        });

        var stats = {
            repeated: 0,
            entries: 0,
            types: {}
        };

        rd.on('line', function (line) {
            var sha1 = crypto.createHash('sha1').update(line).digest('hex');
            var md5 = crypto.createHash('md5').update(line).digest('hex');
            
            var hash = sha1 + md5;
            
            if (hashs.indexOf(hash) === -1) {
                hashs.push(hash);
                // console.log(line);
                var json = JSON.parse(line);
                /*
                var perc = warning(json, stats);
                
                if (perc > 0) {
                    writeTest(json);
                }*/
                genTest(json);
                
                stats.entries++;
            }
            else {
                stats.repeated++;
            }
        });
        
        rd.on('close', function () {
            console.log(
                JSON.stringify(stats, null, '\t')
            );
        });
    }
}

main();

