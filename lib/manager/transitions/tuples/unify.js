"use strict";

const prepare = require("../definitions/prepare");
const utils = require("../../../utils");

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

	const pVariable = zvs.getData(branchId, po.variable);
	const qVariable = zvs.getData(branchId, qo.variable);
	

	const domain = pData.filter(c => qData.includes(c));

	/**
	 * TODO:
	 * - we are generating duplicated domains:
	 * 
	140 => yellow; 142 => blue red; 
	140 => blue; 142 => yellow red; 
	140 => red; 142 => yellow blue; 
	 */

	const toFail = [];
	for (let i=0; i<domain.length; i++) {
		const c = domain[i];

		let qClone = qData.slice();
		let pClone = pData.slice();

		pClone.sort();
		pClone.splice(pData.indexOf(c), 1);
		pClone = pClone.map(c => zvs.getObject(branchId, c));

		qClone.sort();
		qClone.splice(qData.indexOf(c), 1);
		qClone = qClone.map(c => zvs.getObject(branchId, c));

		toFail.push({
			[p]: {
				type: "domain",
				data: [zvs.getObject(branchId, c)],
				variable: pVariable
			},
			[q]: {
				type: "domain", 
				data: qClone,
				variable: qVariable
			}
		});
	}

	let pNegation = pData.filter(c => !domain.includes(c));
	let qNegation = qData.filter(c => !domain.includes(c));

	if (pNegation.length && qNegation.length) {
		pNegation.sort();
		pNegation = pNegation.map(c => zvs.getObject(branchId, c));

		qNegation.sort();
		qNegation = qNegation.map(c => zvs.getObject(branchId, c));

		toFail.push({
			[p]: {
				type: "domain", 
				data: pNegation,
				variable: pVariable
			},
			[q]: {
				type: "domain", 
				data: qNegation,
				variable: qVariable
			}
		});
	}

	const gFailId = zvs.data.global("flop");
	const gFail = zvs.getObject(branchId, gFailId);
	const gDomains = (gFail.data || []).concat(toFail);

	zvs.branches.transform(branchId, gFailId, zvs.data.add({type: 'flop', data: gDomains}));

	if (domain.length === 1) {
		zvs.branches.transform(branchId, p, domain[0]);
		zvs.branches.transform(branchId, q, domain[0]);

		return true;
	}
	else if (domain.length > 0) {
		zvs.update(branchId, p, 
			{
				data: domain.map(
					c => zvs.getObject(branchId, c)
				).sort()
			}
		);

		zvs.branches.transform(branchId, q, p);

		return true;
	}

	return false;
}

function constantXdomain (zvs, branchId, p, q) {
	const qo = zvs.getData(branchId, q);
	const domain = zvs.getData(branchId, qo.data);

	const index = domain.indexOf(p);

	if (index === -1) {
		return false;
	}

	zvs.branches.transform(branchId, q, p);

	if (domain.length > 1) {
		// we need to add some flop to constants, 
		const gFailId = zvs.data.global("flop");
		const gFail = zvs.getObject(branchId, gFailId);
		const gDomains = gFail.data || [];
		const qVariable = zvs.getData(branchId, qo.variable);

		let qClone = domain.slice();
		qClone.splice(index, 1);
		qClone.sort();
		qClone = qClone.map(c => zvs.getObject(branchId, c));

		gDomains.push({
			[q]: {
				type: "domain", 
				data: qClone,
				variable: qVariable
			}
		});

		zvs.branches.transform(branchId, gFailId, zvs.data.add({type: 'flop', data: gDomains}));
	}

	return true;
}

function domainXconstant (zvs, branchId, p, q) {
	return constantXdomain(zvs, branchId, q, p);
}

function flopXflop (zvs, branchId, p, q) {
	const po = zvs.getObject(branchId, p);
	const qo = zvs.getObject(branchId, q);

	const r = zvs.data.add({type: 'flop', data: po.data.concat(qo.data)});
	
	zvs.branches.transform(branchId, p, r);
	zvs.branches.transform(branchId, q, r);

	return true;
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
	},
	"flop": {
		"flop": flopXflop
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

	// Global flops comming to merge.
	/*
	console.log(
		JSON.stringify(zvs.getObject(branchId, p)) + " ** " +
		JSON.stringify(zvs.getObject(branchId, q))
	);

	console.log(
		utils.toString(zvs.getObject(branchId, p)) + " ** " +
		utils.toString(zvs.getObject(branchId, q))
	);*/

	
	if (p !== q) {
		let pt = zvs.getData(branchId, po.type);
		let qt = zvs.getData(branchId, qo.type);

		if (table[pt] && table[pt][qt]) {
			r = table[pt][qt](zvs, branchId, p, q, evalNegation);
		}
		else {
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
