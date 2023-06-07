const {unify} = require("./unify");

const constants = require("./constants");

const {
    varGenerator, 
    getVariable,
    toString,
    copyTerm,
   // prepareVariables
} = require("./base");

module.exports = {
    unify,
    varGenerator,
    getVariable,
    toString,
    copyTerm,
    constants
   // prepareVariables
};
