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

		return {type: 'flop', data: domains};
	}
	else {
		return b;
	}
}

module.exports = {
    multiplyFlop
};
