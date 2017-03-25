var fs = require("fs");
var utils = require("../lib/utils");

function getData (data) {
    try {
        if (data) {
            // TODO: convert only known objects.
            if (data.snapshoot) {
                // DONT LOG THIS,
                return data.NO_LOGGER_snapshoot?data.NO_LOGGER_snapshoot():data.snapshoot();
            }
            else if (
                typeof data === 'object'
            ) {
                return JSON.parse(JSON.stringify(data));
            }
        }
        
        return data;
    }
    catch (e) {
        console.log(e);
        return undefined;
    }
}

function getArgs (args) {
    var r = [];
    for (var i in args) {
        r.push(getData(args[i]));
    }
    
    return r;
}

var now = new Date();
var filename = './logs/log_' + now.toISOString() + '.log';
console.log("Saving log to : " + filename);

function writer (filename) {
    
    var ws = fs.createWriteStream(filename);
    var buffer = [];
    var busy = false;
    function write (q) {
        buffer = [];
        if (q.length > 0) {
            ws.write(q.join(""), "utf8", function (err) {
                if (err) {
                    console.log(err);
                }
                            
                write(buffer);
            });
        }
        else {
            busy = false;
        }
    }
    
    process.on('exit',function(code){
        code || ws.end();
    });
    
    return function (data) {
        if (data) {
            buffer.push(data);
        }
        
        if (!busy) {
            busy = true;

            write(buffer);
        }
    };
}

var write = writer(filename);

function logger (fn, group, name) {
    return function () {
        try {
            var json = {
                type: {class: group, fn: name},
                self: getData(this),
                args: getArgs(arguments),
                result: {},
                report: {args: {}}
            };

            var r = fn.apply(this, arguments);
            
            json.result.value = getData(r);
            json.result.self = getData(this);
            
            if (JSON.stringify(json.self) === JSON.stringify(json.result.self)) {
                delete json.resultSelf;
            }
            
            var args = getArgs(arguments);
            
            for (var i in arguments) {
                if (arguments[i].commit) {
                    json.report.args[i] = utils.table2string(arguments[i].commit())
                }
            }
            
            for (var i=0; i<json.args.length; i++) {
                if (args[i] !== json.args[i]) {
                    json.result.args = json.result.args || {};
                    json.result.args[i] = args[i];
                }
            }

            var jsonString = JSON.stringify(json) + "\n";
            write(jsonString);
            
            return r;
        }
        catch (e) {
            throw e;
        }
    };
}


function setLogger (obj, name, filter) {
    for (var i in obj.prototype) {
        if (
            !filter || filter.indexOf(i) !==-1
            && typeof obj.prototype[i] === "function"
        ) {
            obj.prototype["NO_LOGGER_" + i] = obj.prototype[i];
    	    obj.prototype[i] = logger(obj.prototype[i], name, i);
        }
    }
    
    // also set static functions,
    for (var i in obj) {
        if (
            !filter || filter.indexOf(i) !==-1
            && typeof obj.prototype[i] === "function"
        ) {
            obj["NO_LOGGER_" + i] = obj[i];
    	    obj[i] = logger(obj[i], name, i);
        }
    }
}



module.exports = setLogger;