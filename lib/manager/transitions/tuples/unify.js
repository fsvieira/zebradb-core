"use strict";

const prepare = require("../definitions/prepare");

function tupleXtuple (zvs, branchId, p, q) {
	const po = zvs.getData(branchId, p);
	const qo = zvs.getData(branchId, q);

	const pData = zvs.getData(branchId, po.data);
	const qData = zvs.getData(branchId, qo.data);

	if (pData.length === qData.length) {
		for (let i = 0; i < pData.length; i++) {
			if (!unify(zvs, branchId, pData[i], qData[i])) {
				return;
			}
		}

		return true;
	}

}

function variableXall (zvs, branchId, p, q) {
	zvs.branches.transform(branchId, p, q);
	return true;
}

function allXvariable (zvs, branchId, p, q) {
	zvs.branches.transform(branchId, q, p);
	return true;
}

function domainXdomain (zvs, branchId, p, q) {
	const po = zvs.getData(branchId, p);
	const qo = zvs.getData(branchId, q);

	const pData = zvs.getData(branchId, po.data);
	const qData = zvs.getData(branchId, qo.data);

	const result = [];
	for (let i=0; i<pData.length; i++) {
		const pid = pData[i];
		for (let j=0; j<qData.length; j++) {
			const qid = qData[j];
			// TODO: we need to get unified id, so we an rewrite domain.
			if (unify(zvs, branchId, pid, qid)) {
				result.push(true);
			}
		}
	}

	return result.length > 0;
}

function constantXdomain (zvs, branchId, p, q) {
	const qo = zvs.getData(branchId, q);
	const domain = zvs.getData(branchId, qo.data);

	if (domain.includes(p)) {
		zvs.branches.transform(branchId, q, p);
		return true;
	}

	return false;
}

function domainXconstant (zvs, branchId, p, q) {
	const po = zvs.getData(branchId, p);
	const domain = zvs.getData(branchId, po.data);

	if (domain.includes(q)) {
		zvs.branches.transform(branchId, p, q);
		return true;
	}

	return false;	
}

const table = {
	"tuple": {
		"tuple": tupleXtuple,
		"variable": allXvariable
	},
	"variable": {
		"tuple": variableXall,
		"variable": variableXall,
		"constant": variableXall,
		"domain": variableXall
	},
	"constant": {
		"variable": allXvariable,
		"domain": constantXdomain
	},
	"domain": {
		"domain": domainXdomain,
		"variable": allXvariable,
		"constant": domainXconstant
	}
};

function update (zvs, branchId, p, q) {
	let po = zvs.getData(branchId, p);
	let qo = zvs.getData(branchId, q);

	let updateData = {
		check: zvs.getData(branchId, po.check) ||
			zvs.getData(branchId, qo.check)
	};

	let doUpdate = updateData.check;
	let ns = prepare.union(
		zvs,
		branchId,
		zvs.getData(branchId, po.negation) || [],
		zvs.getData(branchId, qo.negation) || []
	);

	if (ns && ns.length > 0) {
		updateData.negation = ns;
		doUpdate = true;
	}

	if (doUpdate) {
		zvs.update(branchId, p, updateData);
		zvs.update(branchId, q, updateData);
	}

	return true;
}

function unify (zvs, branchId, p, q, evalNegation) {
	p = zvs.branches.getDataId(branchId, p);
	q = zvs.branches.getDataId(branchId, q);

	let po = zvs.getData(branchId, p);
	let qo = zvs.getData(branchId, q);
	let r = true;

	if (p !== q) {
		let pt = zvs.getData(branchId, po.type);
		let qt = zvs.getData(branchId, qo.type);

		if (table[pt] && table[pt][qt]) {
			r = table[pt][qt](zvs, branchId, p, q, evalNegation);
		}
		else {
			console.log("UNIFY ", pt, qt);

			r = false;
		}
	}

	if (!r) {
		// zvs.branches.end(branchId, true, "unify fail!");
		return;
	}

	if (!update(zvs, branchId, p, q)) {
		return;
	}

	return branchId;
}

module.exports = unify;
