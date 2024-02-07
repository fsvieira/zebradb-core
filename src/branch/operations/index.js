const {unify, constants, createBranch} = require("./unify");

const {
    varGenerator, 
    getVariable,
    toString,
    copyTerm,
    copyPartialTerm,
    createMaterializedSet,
   // prepareVariables,
   logger
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
    logger
   // prepareVariables
};
