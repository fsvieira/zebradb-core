const {parse: zparse} = require("../zparser");

function parse (text) {
    return new Promise(function (resolve, reject) {
       resolve({values: zparse(text)});
    });
}

module.exports = parse;