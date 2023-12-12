const {unify, constants} = require("./unify");

const {
    varGenerator, 
    getVariable,
    toString,
    copyTerm,
    copyPartialTerm
   // prepareVariables
} = require("./base");

module.exports = {
    unify,
    varGenerator,
    getVariable,
    toString,
    copyTerm,
    copyPartialTerm,
    constants
   // prepareVariables
};
