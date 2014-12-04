function backtrack(f, r, callback) {
	if (r.length === 0) {
		if (callback(f.getVars()) === false) {
			return false;
		}
	}
	else {
		r.sort(function (a, b) {
			return b.getValues().length < a.getValues().length;
		});
		
		var a = r[0];
		if (a.getValues().length > 0) {
			var version = f.commit();
			var values = a.getValues();
			
			for (var i=0; i<values.length; i++) {
				var value = values[i];
				if (a.setValue(value)) {
					var ctn = backtrack(f, r.slice(1), callback);
					f.reset(version);

					if (ctn === false) {
						f.remove(version);
						return false;
					}
				}
			}
			
			f.remove(version);
		}
	}
}

module.exports = function (factory, callback) {
	backtrack(factory, factory.getVars(), callback);
};

