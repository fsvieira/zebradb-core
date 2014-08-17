var v = require("../../lib/variable").v;

// TODO: make table, 

function and (a, b, r) {
	a.change (function (a, b, r)
		return function () {
			if (r.getValue() === true) {
				a.setValue(true);
				b.setValue(true);
			}
			else if (
					(a.getValue() !== undefined) 
					&& (b.getValue() !== undefined)
			) {
				r.setValue(a.getValue () && b.getValue());
			}
		};
	}(a, b, r));
};
