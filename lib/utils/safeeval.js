/*
    Get global scope and assume that its not going to get polluted,    
*/

var globalScope;
    
try {
  globalScope = global;
}
catch (e) {
  globalScope = window;
}
    
const globals = Object.getOwnPropertyNames(globalScope);
globals.push("window");
globals.push("global");
    
function safeEval (args, code) {
    // we are going to overide this values, don't make them undefined.
    if (code.indexOf("this") !== -1) {
        throw "'this' is not allowed!!";    
    }

    args.forEach(function (t) {
        var index = globals.indexOf(t);
        if (index !== -1) {
            globals.splice(index, 1);
        }
    });
    
    /*
    const c = "return (function (" + globals.join(", ") + ") {return function ("+args.join(", ") +") {" + code + "}})();";
    const f = new Function(c)();
    */

    const c = "(function (ctx, " + globals.join(", ") + ") {return function ("+args.join(", ") +") {'use strict'; " + code + "}});";
    const f = eval.call(null, c);
    
    return f({
        print: function (p) {
            console.log(p);
        },
        json2string: function (j) {
            return JSON.stringify(j, null, '\t');
        }
    });
}

module.exports = safeEval;

