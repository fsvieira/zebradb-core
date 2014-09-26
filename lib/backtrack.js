var Variable = require("./variable");

function backtrack(f, r, callback) {
	if (r.length === 0) {
		callback(f.getVars());
	}
	else {
		r.sort(function (a, b) {
			return b.getValues().length < a.getValues().length;
		});
		
		var a = r[0];
		if (a.getValues().length > 0) {
			a.getValues().forEach (function (value) {
				f.save();
				if (a.setValue(value)) {
					backtrack(f, r.slice(1), callback);
				}
				f.load();
			});
		}
	}
}

module.exports = function (factory, callback) {
	backtrack(factory, factory.getVars(), callback);
};

