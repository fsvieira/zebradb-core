const {unify, constants} = require("./unify");

const {
    varGenerator, 
    getVariable,
    toString,
    copyTerm,
    copyPartialTerm,
    createMaterializedSetCs
   // prepareVariables
} = require("./base");

module.exports = {
    unify,
    varGenerator,
    getVariable,
    toString,
    copyTerm,
    copyPartialTerm,
    constants,
    createMaterializedSetCs
   // prepareVariables
};
