const {unify, constants, createBranch} = require("./unify");

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
    createBranch,
    varGenerator,
    getVariable,
    toString,
    copyTerm,
    copyPartialTerm,
    constants,
    createMaterializedSetCs
   // prepareVariables
};
