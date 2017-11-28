const Data = require("./data");
const Branches = require("./branches");
const Events = require("../events");

function getTopCode (code, changes) {
	while(changes[code]) {
		code = changes[code];
	}
	
	return code;
}

class ZVS {
	constructor (events) {
		this.version = {
			major: 1,
			minor: 0,
			patch: 0
		};

		this.events = events || new Events();
		this.data = new Data(this.events);
		this.branches = new Branches(this.events);
		this.actions = {};
		this.definitionsMatch = {};
	}
	
	getRawData (branchId, dataId) {
		return this.data.get(this.branches.getDataId(branchId, dataId));
	}

	getData (branchId, dataId) {
		var data = this.getRawData(branchId, dataId);
		return data?data.data:undefined;
	}

	update (branchId, id, obj) {
		var o = this.getData(branchId, id);
	
		var clone = Object.assign({}, o);
	
		for (var i in obj) {
			var a = this.data.add(obj[i]);
			clone[i] = a; 
		}
		
		this.branches.transform(branchId, id, this.data.getId(clone));
	}

	getObject (branchId, dataId) {
		branchId = branchId || this.branches.root;
	
		var obj = this.getData(branchId, dataId);
		var r;
		var self = this;
		
		if (obj instanceof Array) {
			r = obj.map(
				function (o) {
					return self.getObject(branchId, o);	
				}
			);
		}
		else if (typeof obj === 'object') {
			r = {};
			for (var i in obj) {
				r[i] = this.getObject(branchId, obj[i]);
			}
		}
		else {
			r = obj;
		}

		return r;
	}
	
	/*
		This will get all updated ids of the given dataId and record it 
		on branch changes.
	*/
	getUpdatedId (branchId, dataId, stack) {
		
		stack = stack || [];
		if (stack.indexOf(dataId) !== -1) {
			// throw "Invalid data found " + dataId + ", is cyclic!!";
			// Data definition is cyclic and therefor does not exists.
			console.log("Cyclic data found " + dataId);
			return;
		}

		stack.push(dataId);

		dataId = this.branches.getDataId(branchId, dataId);
		
		var t = this.data.get(dataId).data;
		var dirty = false;
		
		if (t instanceof Array) {
			// clone array,
			t = t.slice(0);

			for (var i=0; i<t.length; i++) {
				const id = this.getUpdatedId(branchId, t[i], stack.slice(0));
				
				if (id === undefined) {
					return;
				}

				if (t[i] !== id) {
					dirty = true;
				}
				
				t[i] = id;
			}
		}
		else if (typeof t === 'object') {
			// clone object,
			t = Object.assign({}, t);
			for (var i in t) {
				const id = this.getUpdatedId(branchId, t[i], stack.slice(0));

				if (id === undefined) {
					return;
				}
				
				if (t[i] !== id) {
					dirty = true;
				}
				
				t[i] = id;
			}
		}
		
		if (dirty) {
			const id = this.data.getId(t);
			this.branches.transform(branchId, dataId, id);
			dataId = id;
		}
		
		return dataId;
	}

	getChangesCodes (branchsHashs) {
		var codes = {};
		branchsHashs = branchsHashs.slice(0);
	
		for (var i=0; i<branchsHashs.length; i++) {
			var branchHash = branchsHashs[i];
			var branch = this.branches.getRawBranch(branchHash);
			
			if (branch.metadata.changes) {
				Object.assign(codes, branch.metadata.changes);
			}
			
			if (
				typeof branch.data.parent === 'number' &&
				branchsHashs.indexOf(branch.data.parent) === -1
			) {
				branchsHashs.push(branch.data.parent);
			}
		}
		
		for (var i in codes) {
			codes[i] = [];
		}
		
		return codes;
	}

	merge (branchsHashs, conflictHandler, action) {
		if (branchsHashs.length <= 1) {
			return branchsHashs;
		}
		
		var changes = this.getChangesCodes(branchsHashs);
		var cs;
		var newCode;
		
		for (var code in changes) {
			code = +code;
			for (var i=0; i<branchsHashs.length; i++) {
				newCode = this.branches.getDataId(branchsHashs[i], code);
				cs = changes[code];
	
				if (
					newCode !== code &&
					cs.indexOf(newCode) === -1
				) {
					cs.push(newCode);
				}
			}
		}
		
		var conflicts = {};
		
		for (var code in changes) {
			code = +code;
			cs = changes[code];
	
			changes[code] = cs[0];
	
			if (cs.length > 1) {
				conflicts[code] = cs;
			}
		}
		
		// remove defers,
		// defers will never occur on conflits,
		for (var code in changes) {
			code = +code;
			changes[code] = getTopCode(code, changes);
		}
		
		// remove codes that don't change,
		for (var code in changes) {
			code = +code;
			if (changes[code] === code) {
				delete changes[code];
			}
		}
	
		const level = this.branches.getLevel(branchsHashs[0]) + 1;
		
		var bHash = this.branches.getId({
			parent: branchsHashs,
			args: branchsHashs.slice(0),
			action: action || "_merge",
			level: level
		}).branchId;
		
		var rawBranch = this.branches.getRawBranch(bHash);
	
		rawBranch.metadata.changes = changes;
	
		var branchs = [];
		
		for (var code in conflicts) {
			code = +code;
			cs = conflicts[code];
			var b = conflictHandler(this, {branchId: bHash, args: cs}); // this.change(bHash, conflictHandler, cs);
			
			if (!b) {
				return;
			}
			
			branchs.push(b);
		}
	
		if (branchs.length === 0) {
			return [bHash];
		}
		
		return this.merge(branchs, conflictHandler);
	}
	
	// TODO: we need to get a better definitions/version system,
	// TODO: we need to start making zvs very specific to zebrajs.
	addDefinitionsMatch (definitionsBranchId, match) {
		this.definitionsMatch[definitionsBranchId] = match;
	}
}

module.exports = ZVS;
