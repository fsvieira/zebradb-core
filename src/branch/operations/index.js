const {unify, constants, createBranch} = require("./unify");

const {
    varGenerator, 
    getVariable,
    toString,
    copyTerm,
    copyPartialTerm,
    createMaterializedSet,
   // prepareVariables,
   logger,
   getContextState
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
    createMaterializedSet,
    logger,
    getContextState
   // prepareVariables
};
