"use strict";

const {parse: zparse} = require("./zparser");

function parse (req, res) {
    let parsed;
    const text = req.args;

    try {
        parsed = zparse(text);
    }
    catch (e) {
        // TODO: make kanban handle errors,
        // or handle errors on manager as a special value.
        console.log(
        	"Exception (l=" + e.line + ", c="+ e.column + ") " + e.message
        );
    }

    res.send({values: parsed});
}

module.exports = parse;