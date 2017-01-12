var crypto = require('crypto');

var version = {
	major: 1,
	minor: 0,
	patch: 0
};

/*
	Branch Class,
	* used as temporary object on zvs.change function.
*/
function Branch (
	zvs,
	id
) {
	this.zvs = zvs;
	this.id = id;
	this.counter = 0;
}

/*
Branch.prototype.getId = function () {
	return this.id + ":" + this.counter++;
};*/

Branch.prototype.uniqueId = function () {
	return this.id + "$" + this.counter++;
};

Branch.prototype.get = function (code) {
	return this.zvs.getData(this.id, code);
};

Branch.prototype.getId = function (code) {
	return this.zvs.getId(this.id, code);
};
		
// Call action to change data,
Branch.prototype.change = function (action, args, branch) {
	return this.zvs.change(action, args, branch || this.id);
};

// Tranform a hash code to other hash code (tran)
Branch.prototype.transform = function (oldCode, newCode) {
	return this.zvs.transform(this.id, oldCode, newCode);	
};

// It updates the object fields.
Branch.prototype.update = function (code, obj) {
	this.zvs.update(this.id, code, obj);
};

Branch.prototype.getObject = function (code) {
	return this.zvs.getObject(code, this.id);
};

Branch.prototype.add = function (obj) {
	return this.zvs.add(obj, this.id);
};

/*
	ZVS Class
*/
function ZVS (objects) {
	this.objects = objects || {
		version: version,
		branchs: {},
		data: {},
		active: [],
		cache: {}
	};

	this.actions = {};
	
	this.objects.root = this.objects.root || this.branchHash({
		type: 'branch',
		action: 'init'
	});
}

// Static methods,
ZVS.sha1 = function (obj) {
	var objStr = obj;

	if (obj instanceof Array || typeof obj === 'object') {
		objStr = JSON.stringify(obj);
	}
	else {
		objStr = (typeof obj)[0] + "%" + obj;
	}
	
	if (objStr.length > 30) {
		return crypto.createHash('sha1').update(objStr).digest('hex');
	}
	else {
		return objStr;
	}
};


/*
===============================================
				Branch Methods
===============================================
*/
ZVS.prototype.branchHash = function (obj) {
    Object.freeze(obj);
	var hash = ZVS.sha1(obj);
	var o;
	var i=0;

    var objStr = JSON.stringify(obj);

	// Prevent hash clashing,
	for(;;) {
		o = this.objects.branchs[hash];
		
		if (!o) {
            break;
		}
		
		o = o.data;

		var oStr = JSON.stringify(o);

		if (oStr === objStr) {
			break;
		}

		i++;
		hash = hash + "$" + i;
	}
	
	var branch = this.objects.branchs[hash];
	if (!branch) {
	    branch = this.objects.branchs[hash] = {
	        data: obj,
	        metadata: {
	        	changes: {}
	        }
	    };
	    
	    this.objects.active.push(hash);
	    
	    if (branch.data.parent) {
	    	this.objects.active.splice(this.objects.active.indexOf(branch.data.parent), 1);
	    }
	}
	
	return hash;
};

ZVS.prototype.getRawBranch = function (branchHash) {
	return this.objects.branchs[branchHash];
};

ZVS.prototype.getBranch = function (branchHash) {
	var branch = this.getRawBranch(branchHash);
	
	return branch?branch.data:undefined;
};


/*
===============================================
				Data Methods
===============================================
*/

/* 
    data-hash:
        1. sha1 (obj),
        2. check with unavailable-sha1 contraints,
        3. compare with object using with that sha1 (use get)
*/
ZVS.prototype.dataHash = function (branchHash, obj) {
    Object.freeze(obj);
	var hash = ZVS.sha1(obj);
	var o;
	var i=0;

    var objStr = obj; 
	if (obj instanceof Array || typeof obj === 'object') {
		objStr = JSON.stringify(obj);
	}
	
	// Prevent hash clashing,
	for(;;) {
		o = this.objects.data[hash];
		
		if (!o) {
            break;
		}

		o = o.data;
		var oStr = o;
	
		if (o instanceof Array || typeof o === 'object') {
			oStr = JSON.stringify(o);
		}
		
		if (oStr === objStr) {
			break;
		}

		i++;
		hash = hash + "$" + i;
	}
	
	if (!this.objects.data[hash]) {
	    this.objects.data[hash] = {
	        data: obj,
	        metadata: {
	            refs: 0
	        }
	    };
	}

	// get real id for this branch,
	// return this.getId(branchHash, hash);
	return hash;
};


/*
    get
*/
/*
ZVS.prototype.getId = function (branchHash, code) {
    var b = this.getRawBranch(branchHash);
	
	if (typeof b.data.parent !== 'string') {
		return b.metadata.changes[code] || code;
	}
	
	if (b.metadata.changes) {
		var defer = b.metadata.changes[code];
		
		if (defer) {
			return this.getId(branchHash, defer);
		}
	}
	
	// else search on parent,
	return this.getId(b.data.parent, code);
};*/

ZVS.prototype.getId = function(branchHash, code) {
	var c, b;
	var bh = branchHash;
	
	do {
		code = c || code;
		b = this.getRawBranch(bh);
		c = b.metadata.changes[code];
		
		if (c === undefined) {
			if (typeof b.data.parent === 'string') {
				bh = b.data.parent;
			}
			else {
				c = code;
			}
		}
		else {
			bh = branchHash;
		}
	} while (c !== code);
	
	return c;
};

ZVS.prototype.getRawData = function (branchHash, code) {
	return this.objects.data[this.getId(branchHash, code)];
};

ZVS.prototype.getData = function (branchHash, code) {
	var data = this.getRawData(branchHash, code);
	
	return data?data.data:undefined;
};

/*
===============================================
				Data Operators
===============================================
*/

// add,
/*
    TODO: 
        * add branch obj,
        * register all added hashs on branch add [] (no copies).
            * if its inserted (first time) then ref++
*/
ZVS.prototype.add = function (obj, branchHash) {
    var r = obj;
	var self = this;
	
	branchHash = branchHash || this.objects.root;
	
	if (obj instanceof Array) {
		r = obj.map(
			function (o) {
				return self.add(o, branchHash);	
			}
		);
		
		r = this.dataHash(branchHash, r);
	}
	else if (typeof obj === 'object') {
		r = {};
		for (var i in obj) {
			r[i] = this.add(obj[i], branchHash);
		}
			
		r = this.dataHash(branchHash, r);
	}
	else {
		r = this.dataHash(branchHash, r);
	}
	
	return r;
};

ZVS.prototype.transform = function (branchHash, oldCode, newCode) {
	if (oldCode !== newCode) {
		this.getRawBranch(branchHash).metadata.changes[oldCode] = newCode;
	}
};

ZVS.prototype.update = function (branchHash, code, obj) {
	var o = this.getData(branchHash, code);

	var clone = Object.assign({}, o);

	for (var i in obj) {
		var a = this.add(obj[i]);
		clone[i] = a; 
	}
	
	this.transform(branchHash, code, this.dataHash(this.objects.root, clone));
};


ZVS.prototype.change = function (action, args, branchHash) {
	branchHash = branchHash || this.objects.root;

	// don't let father branch change,
	Object.freeze(this.getRawBranch(branchHash).metadata.changes);

	var bHash = this.branchHash({
		parent: branchHash,
		type: 'branch',
		args: args.slice(0),
		action: action
	});

	var r = this.objects.cache[bHash];

	if (r !== undefined) {
		return r || undefined;
	}

	var branch = this.getRawBranch(bHash);

	var actionCall = this.actions[action];

	r = actionCall.apply(
		new Branch(this, bHash),
		args.slice(0)
	);
	
	if (r === true) {
		r = bHash;
	}
	
	branch.metadata.result = r;

	this.objects.cache[bHash] = r || false;

	return r;
};

// -----------------
ZVS.prototype.getObject = function (code, branch) {
	branch = branch || this.objects.root;

	var obj = this.getData(branch, code);
	var r;
	var self = this;
	
	if (obj instanceof Array) {
		r = obj.map(
			function (o) {
				return self.getObject(o, branch);	
			}
		);
	}
	else if (typeof obj === 'object') {
		r = {};
		for (var i in obj) {
			r[i] = this.getObject(obj[i], branch);
		}
	}
	else {
		r = obj;
	}

	return r;
};

/*
	Actions,
*/
ZVS.prototype.action = function (name, action) {
	this.actions[name] = action;

	return this;
};


/*
	Merge,
*/
// TODO: normalize names, codes? ids? branchs code? data codes?
// Write a style document.
ZVS.prototype.getChangesCodes = function (branchsHashs) {
	var codes = {};
	branchsHashs = branchsHashs.slice(0);

	for (var i=0; i<branchsHashs.length; i++) {
		var branchHash = branchsHashs[i];
		var branch = this.getRawBranch(branchHash);
		
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
};

function getTopCode (code, changes) {
	while(changes[code]) {
		code = changes[code];
	}
	
	return code;
}

ZVS.prototype.merge = function (branchsHashs, conflictHandler) {
	if (branchsHashs.length <= 1) {
		return branchsHashs;
	}
	
	var changes = this.getChangesCodes(branchsHashs);
	var cs;
	var newCode;
	
	for (var code in changes) {
		for (var i=0; i<branchsHashs.length; i++) {
			newCode = this.getId(branchsHashs[i], code);
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
		/*
		if (cs.length === 1) {
			changes[code] = cs[0];
		}
		else {
			conflicts[code] = cs;
			delete changes[code];
		}*/
		
		
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
	
	var bHash = this.branchHash({
		parent: branchsHashs,
		type: 'branch',
		args: [branchsHashs.slice(0), conflictHandler],
		action: "_merge"
	});
	
	this.getRawBranch(bHash).metadata.changes = changes;
	
	var branchs = [];
	
	for (var code in conflicts) {
		cs = conflicts[code];
		var b = this.change(conflictHandler, cs, bHash);
		
		if (!b) {
			// this branch can't be merged.
			return;
		}
		
		branchs = branchs.concat(b);
	}
	
	
	if (branchs.length === 0) {
		return [bHash];
	}
	
	return this.merge(branchs, conflictHandler);
};

module.exports = ZVS;
