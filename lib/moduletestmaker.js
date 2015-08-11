var fs = require("fs");

function argsToString (args) {
    var keys = Object.keys(args).sort();
    var s = "";
    for (var i=0; i<keys.length; i++) {
        var k = keys[i];
        var a = args[k];

        if (s.length > 0) {
            s += ",\n";
        }
        
        if (a instanceof Object) {
            s += JSON.stringify(a, null, '\t');
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

function proxy (module, options) {

    options = options || {};
    options.prefix = options.prefix || "";
    options.out = (options.out || options.prefix);
    var now = new Date().getTime();
    
    if (options.enable === false) {
        return module;
    }

    var p = options.replace?module:{};
    
    var dups = [];
    
    function print (s, name) {
        if (!options.filter || options.filter.test(s)) {
            if (dups.indexOf(s) === -1) {
                dups.push(s);
                fs.appendFileSync(options.out + (options.split?"_" + name:"") + "__" + now + ".js", s);
            }
        }
    }
    
    print("var should = require('should');\n" + options.init);
    
    for (var i in module) {
        var fn = module[i];
        if (typeof fn === 'function') {
            p[i] = function (call, name) {
                return function () {
                    var args = "(" + argsToString(arguments) + ")";
                    var result = call.apply(this, arguments);
                    var rj;

                    if (result) {
                        rj = JSON.stringify(result, null, '\t');
                        if (rj) {
                            print("\n\nshould(" + options.prefix + name + args + ").eql(" + rj +");", name);
                        }
                    }
                    else {
                        rj = result;   
                        print("\n\nshould(" + options.prefix + name + args + ").eql(" + rj +");", name);
                    }
                    return result;
                };
            }(module[i], i);
        }
    }
    
    return p;
}


module.exports = {
    proxy: proxy
};

