const include = require("./include");
const parse = require("./parse");


const {check} = require("./check");
const merge = require("./merge");
const negations = require("./negations");
const select = require("./select");

/*
Definitions
*/
const prepareDefinitions = require("./definitions/prepare-definitions");
const checkDefinitions = require("./definitions/check-definitions");
const multiplyDefinitions = require("./definitions/multiply-definitions");
/*
    Query,
*/
const prepareQuery = require("./query/prepare-query");
const checkDepth = require("./query/check-depth");
const updateQuery = require("./query/update-query");
const filterUncheckedNegations = require("./negations/filter-unchecked-negations");
const filterUncheckedTuples = require("./query/filter-unchecked-tuples");

/*
    Unify
*/
const matchTuples = require("./unify/match-tuples");
const copyDefinitions = require("./unify/copy-definitions");

module.exports = {
    include,
    parse,
    check,
    merge,
    negations,
    select,
    
    // definitions,
    prepareDefinitions,
    checkDefinitions,
    multiplyDefinitions,
    
    // query
    prepareQuery,
    checkDepth,
    updateQuery,
    filterUncheckedTuples,
    
    // Unify
    matchTuples,
    copyDefinitions,
    
    // negations,
    filterUncheckedNegations
};

