/**
 * TODO:
 *  - Normalize domains and flops, currently domains and flops spec is fuzzy.
 * 
 * 1. Domains: Possible values (constants) one variable can take.
 * 	 a. type: 'domain',
 *   b. data: Array of constants,
 *   c. variable: an id for the original variable that was replaced by domain.
 * 
 * 2. Flop: A set of two or one domains containing failing pair of values. 
 * 	 a. type: 'flop',
 * 	 b. data: Array of objects:
 * 		* each object contains two domains:
 * 			{domainIDa: domainA, domainIDb: domainB}
 * 
 * 3. Merge flops:
 * 	 a. Multiply array of objects,
 *   b. all domainID's must match, id and variable.
 *   c. intersect both domain data, intersection can't be empty, if empty fail.
 */

const utils = require("./utils");

function mergeDomains (a, b) {
	const r = {};

	for (let n in a) {
		const ra = a[n];
		const rb = b[n];

		if (ra && rb && ra.variable === rb.variable) {
			const d = {type: 'domain', data: ra.data.filter(n => {
				// TODO: optimize this by extracting constant values to an tmp array.
				for (let i=0; i<rb.data.length; i++) {
					if (rb.data[i].data === n.data) {
						return true;
					}
				}

				return false;
			}), variable: ra.variable};

			if (d.data.length) {
				r[n] = d;
			}
			else {
				// can't merge domain, its not possible to find a common failing state.
				return;
			}

		}
		else {
			// can't merge domain, its not possible to find a common failing state.
			return;
		}
	}

	return r;
}

function multiplyFlop (a, b) {

	if (a) {
		const domains = [];
		for (let i=0; i<a.data.length; i++) {
			const domainA = a.data[i];
			
			for (let j=0; j<b.data.length; j++) {
				const domainB = b.data[j];
				const r = mergeDomains(domainA, domainB);
	
				if (r) {
					domains.push(r);
				}
			}	
		}

		console.log(JSON.stringify(a) + " ** " + JSON.stringify(b) + " = " + JSON.stringify(domains));

		return {type: 'flop', data: domains};
	}
	else {
		return b;
	}
}

function calcDomains (zvs, value, equals, all) {

	const results = [];

	const v = zvs.getObject(zvs.branches.root, value);
	let vdata;
	if (v.type === 'constant') {
		vdata = {
			type: 'domain', 
			data: [v]
		};
	}
	
	/**
	 * a = [1, 2, 3, 4]
	 * b = [1, 2, 3]
	 * e => [1, 2]
	 * --- domains ---
	 * a=1, b=[2, 3]
	 * a=2, b=[1, 3]
	 * a=[2, 3, 4], b=1
	 * a=[1, 3, 4], b=2
	 * 
	 * --- domain original ---
	 * a = 1, b=[2, 3]
	 * ...
	 * a = 3, b=[1, 2]
	 */

	for (let i=0; i<equals.length; i++) {
		const aid = equals[i];

		for (let k=0; k<vdata.data.length; k++) {
			// get current value for id, 
			const v = vdata.data[k];

			// gen all possible domains,
			for (let j=0; j<equals.length; j++) {
				if (i !== j) {
					const bid = equals[j];
					const b = all[bid];
					const negation = b.data.slice();
					negation.splice(negation.findIndex(n => n.data === v.data), 1);

					const r = {
						...all,
						[aid]: {type: 'domain', data: [v], variable: all[aid].variable},
						[bid]: {type: 'domain', data: negation, variable: b.variable} 
					};

					// TODO: put all other domains in here.
					results.push(r);
				}
			}
		}
	}

	return results;	
}

function getFlop (flop, zvs, branchId, domains) {
	// get domains,

	const equals = {};

	const domainsObjects = {};

	for (let i=0; i<domains.length; i++) {
		const id = domains[i];
		const bid = zvs.branches.getDataId(branchId, id);
		const e = equals[bid] = equals[bid] || [];

		domainsObjects[id] = zvs.getObject(zvs.branches.root, id);
		e.push(id);
	}

	let r = [];
	for (let id in equals) {
		const e = equals[id];
		const ds = calcDomains(zvs, id, e, domainsObjects);
		r = r.concat(ds);
	}

	console.log("flop => " + JSON.stringify(r));

	return r;
}


module.exports = {
	multiplyFlop,
	getFlop
};
