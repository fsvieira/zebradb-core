const {unify} = require("./unify");
const {
    varGenerator, 
    getVariable,
    toString,
    copyTerm,
    prepareVariables
} = require("./base");

module.exports = {
    unify,
    varGenerator,
    getVariable,
    toString,
    copyTerm,
    prepareVariables
};
