const filterUncheckedTuples = require("./filter-unchecked-tuples");
const matchTuples = require("./match-tuples");
const copyDefinitions = require("./copy-definitions");
const check = require("./check");
const actionUnify = require("./actionUnify");
const domains = require("./domains");
const splitUncheckedDomain = require("./splitUncheckedDomain");

module.exports = {
	matchTuples,
	copyDefinitions,
	filterUncheckedTuples,
	check,
	actionUnify,
	domains,
	splitUncheckedDomain
};
