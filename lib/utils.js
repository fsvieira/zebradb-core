"use strict";

function getVariableName (v, variableNames) {
	const vname = v.data || "";
	const vars = variableNames[vname] = variableNames[vname] || [];

	if (vars.indexOf(v.id) === -1) {
		vars.push(v.id);
	}

	const n = vars.indexOf(v.id);

	return "'" + vname + (n ? "$" + n : "");
}

function toString (p, debug, negations, variableNames) {

	variableNames = variableNames || {};

	const ts = v => toString(v, debug, negations, variableNames);

	if (!p) {
		return "";
	}

	switch (p.type) {
		case "domain":
			return "{{" + toString(p.data) + "}}";

		case "tuple":
			return (!negations && debug && p.check ? "@" : "") +
				(negations && debug && p.exists === false ? "!" : "") +
				"(" + p.data.map(ts).join(" ") + ")" +
				(p.negation && p.negation.length ? "[^" +
					toString(p.negation, debug, true, variableNames) + "]" : ""
				);

		case "constant":
			return p.data;

		case "variable":
			return getVariableName(p, variableNames);

		default:
			if (p.map) {
				return p.map(ts).sort().join("\n");
			}
	}
}

function printQuery (zvs, branchId, text) {
	console.log(
		(text ? text + " => " : "") +
		toString(zvs.getObject(branchId, zvs.data.global("query")), true)
	);
}

module.exports = {
	toString: toString,
	printQuery: printQuery
};
