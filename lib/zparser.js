var parser = require("./z_parser.js");
var fs = require("fs");
var path = require("path");

function getFile (filePath) {
    return fs.readFileSync(filePath, "utf8").toString();
}

function _parse (code, root, files) {
    files = files || {};
    root = root || "";

    var defs = parser.parse(code);
    var imports = [];

    for (var i=0; i<defs.length; i++) {
        var d = defs[i];
        if (d.type === "import") {
            defs.splice(i, 1);
            var filePath = path.join(root, d.path + ".z");
            if (!files[filePath]) {
                files[filePath] = _parse(getFile(filePath), path.dirname(filePath), files);
                imports.push(files[filePath]);
            }
        }
    }
    
    imports.forEach (function (code) {
        defs = defs.concat(code);
    });
    
    return defs;
}

function parse (code, root, files) {
    var defs = _parse(code, root, files);

    var result = {
        definitions: [],
        queries: []
    };
    
    for (var i=0; i<defs.length; i++) {
        if (defs[i].type === 'query') {
            result.queries.push(defs[i]);
        }
        else {
            result.definitions.push(defs[i]);
        }
    }
    
    return result;
}

module.exports = {
    parse: parse
};