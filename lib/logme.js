var fs = require("fs");
var utils = require("./utils.js");

function argsToString (args, json) {
    var keys = Object.keys(args).sort();
    var s = "";
    for (var i=0; i<keys.length; i++) {
        var k = keys[i];
        var a = args[k];

        if (s.length > 0) {
            s += ",\n";
        }
        
        if (a instanceof Object) {
            var r = utils.toString(a);
            if ((r[0] !== '{') && (r[0] !== '[')) {
                r = '"' + r + '"';
            }
            
            s+=r  + (json?' ==> ' + JSON.stringify(a, null, '\t'):"");
        }
        else if (typeof a === 'string') {
            s += '"' + a + '"';
        }
        else {
            s += a;
        }
        
    }
    
    return s;
}

function check (name, t) {
    if (t) {
        if (t.vars) {
            for (var i in t.vars) {
                if (t.vars[i]
                    && (t.vars[i].type === 'defered')
                    && (t.vars[i].variable.name !== i)
                ) {
                    throw new Error ("["+name+"] Variable name mismatch declaration: " + i + " !== " + JSON.stringify(t.vars[i].variable));
                }
            }
        }
    }
}

function checkArgs (name, args) {
    var keys = Object.keys(args).sort();
    for (var i=0; i<keys.length; i++) {
        var k = keys[i];
        var a = args[k];
        check(name, a);
    }
}


function proxy (module, options) {

    options = options || {};
    options.prefix = options.prefix || "";
    options.out = (options.out || options.prefix);
    var now = new Date().getTime();
    
    if (options.enable === false) {
        return module;
    }

    var p = module;
    
    function print (s, name) {
        if (!options.filter || options.filter.test(s)) {
            fs.appendFileSync(options.out + (options.split?"_" + name:"") + "__" + now + ".js", s);
        }
    }
    
    var save = {};
    
    for (var i in module) {
        var fn = module[i];
        if (typeof fn === 'function') {
            save[i] = fn;
            p[i] = function (call, name) {
                return function () {
                    var args = "(" + argsToString(arguments, options.json) + ")";
                    
                    checkArgs(name + args, arguments);
                    
                    var result = call.apply(this, arguments);
                    var rj;

                    if (result) {
                    
                        if (result.map || result.query || result.type || result.vars) {
                            // rj = JSON.stringify(result, null, '\t');
                            rj = utils.toString(result) + (options.json?"==> " + JSON.stringify(result, null, '\t'):"");
                            
                            if ((rj[0] !== '{') && (rj[0] !== '[')) {
                                rj = '"' + rj + '"';
                            }
                        }
                        else {
                            rj = JSON.stringify(result, null, '\t') || result;
                        }

                        if (rj) {
                            print("\nshould(" + options.prefix + name + args + ").eql(" + rj +")\n\n", name);
                        }
                        
                        check(name, result);                        
                    }
                    else {
                        rj = result;   
                        print("\n\nshould(" + options.prefix + name + args + ").eql(" + rj +")\n\n", name);
                    }
                    
                    return result;
                };
            }(module[i], i);
        }
    }
    
    return function () {
        for (var i in save) {
            module[i] = save[i];
        }
    };
}


module.exports = {
    proxy: proxy
};

