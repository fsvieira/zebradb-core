const include = require("./include");
const parse = require("./parse");
const prepareTuples = require("./prepareTuples");
const definitions = require("./definitions");
const plan = require("./plan");
const {check, check2merge} = require("./check");
const merge = require("./merge");
const negations = require("./negations");

module.exports = {
    include,
    parse,
    prepareTuples,
    definitions,
    plan,
    check,
    check2merge,
    merge,
    negations
};

