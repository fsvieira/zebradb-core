const Data = require("./data");
const Branches = require("./branches");

function getTopCode (code, changes) {
	while(changes[code]) {
		code = changes[code];
	}
	
	return code;
}

class ZVS {
	constructor () {
		this.version = {
			major: 1,
			minor: 0,
			patch: 0
		};
		
		this.cache = {};
		this.data = new Data();
		this.branches = new Branches();
		this.actions = {};	
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
		
		this.branches.transform(branchId, id, this.data.dataHash(clone));
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
	getUpdatedId (branchId, dataId) {
		dataId = this.branches.getDataId(branchId, dataId);
		
		const t = this.data.get(dataId);
		var dirty = false;
		
		if (t instanceof Array) {
			for (var i=0; i<t.length; i++) {
				const id = this.getUpdatedId(branchId, t[i]);
				
				if (t[i] !== id) {
					dirty = true;
				}
				
				t[i] = id;
			}
		}
		else if (typeof t === 'object') {
			for (var i in t) {
				const id = this.getUpdatedId(branchId, t[i]);

				if (t[i] !== id) {
					dirty = true;
				}
				
				t[i] = id;
			}
		}
		
		if (dirty) {
			const id = this.data.dataHash(t);
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
				typeof branch.data.parent === 'string' &&
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
			cs = changes[code];
	
			changes[code] = cs[0];
	
			if (cs.length > 1) {
				conflicts[code] = cs;
			}
		}
		
		// remove defers,
		// defers will never occur on conflits,
		for (var code in changes) {
			changes[code] = getTopCode(code, changes);
		}
		
		// remove codes that don't change,
		for (var code in changes) {
			if (changes[code] === code) {
				delete changes[code];
			}
		}
	
		const level = this.branches.getLevel(branchsHashs[0]) + 1;
		
		var bHash = this.branches.branchHash({
			parent: branchsHashs,
			args: branchsHashs.slice(0),
			action: action || "_merge",
			level: level
		});
		
		var rawBranch = this.branches.getRawBranch(bHash);
	
		rawBranch.metadata.changes = changes;
	
		var branchs = [];
		
		for (var code in conflicts) {
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
}

module.exports = ZVS;
