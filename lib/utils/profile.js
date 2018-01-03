"use strict";

let counters = {};
let start = new Date().getTime();

function reset () {
	counters = {};
	start = new Date().getTime();
}

function profile (f, id) {
	if (f instanceof Function) {
		return (...args) => {
			counters[id] = counters[id] || { occurrences: 0, totalTime: 0 };

			let t = new Date().getTime();
			let r = f.apply(this, args);
			let d = new Date().getTime() - t;

			let c = counters[id];

			c.totalTime += d;
			c.occurrences++;

			return r;
		};
	}
	else {
		return f;
	}
}

function profileClass (theClass) {
	const ids = Object.getOwnPropertyNames(theClass.prototype);
	ids.map(id => {
		const f = theClass.prototype[id];
		theClass.prototype[id] = profile(f, theClass.name + "." + id);
	});
}

function printCounters () {
	let end = new Date().getTime();
	let fulltime = end - start;
	let s = "";

	for (let id in counters) {
		if (counters.hasOwnProperty(id)) {
			try {
				const c = counters[id];
				const avg = c.totalTime / c.occurrences;
				const perc = c.totalTime * 100 / fulltime;

				if (perc > 5) {
					s += "\t" + id +
						": total= " + (c.totalTime / 1000).toFixed(3) +
						"s, occ=" + c.occurrences +
						" avg= " + (avg / 1000).toFixed(3) +
						"s, perc= " + perc.toFixed(2) + "%\n";
				}
			}
			catch (e) {
				s += e;
			}
		}
	}

	s += "\tfull time: " + fulltime / 1000 + "s";

	console.log(s);
	return s;
}

module.exports = {
	reset,
	profile,
	profileClass,
	printCounters
};
