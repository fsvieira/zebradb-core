"use strict";

const Tranformation = require("./transformation");

function storeFunctions (req, res) {
	const { functions } = req.store;
	const funcDescription = req.args;
	const func = new Tranformation(funcDescription, functions);

	functions[funcDescription.name] = func;

	res.send({});
}

module.exports = storeFunctions;
