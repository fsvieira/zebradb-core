const {parse: zparse} = require("../../zparser");

function parse (text) {
    return new Promise(function (resolve, reject) {
        var parsed;
        try {
            parsed = zparse(text);
        }
        catch (e) {
            // TODO: make kanban handle errors,
            // or handle errors on manager as a special value.
            console.log("Exception (l=" + e.line + ", c="+ e.column + ") " + e.message);
        }
        
        resolve({values: parsed});
    });
}

module.exports = parse;