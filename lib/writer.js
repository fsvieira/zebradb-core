var unify = require("./unify");

var Writer = function (p, q, writePointer, write) {
    this.p = p;
    this.q = q;
    
    this.writePointer = writePointer || len(p) + len(q);
    
    this.write = write || {};
};

function copy (v, index) {
	var d = v.data;
	
	if (v.type === 'tuple' || v.type === 'unify') {
	    d = [];

	    for (var i=0; i<v.data.length; i++) {
    		d.push(index + v.data[i]);
	    }
	}
	else if (v.type === 'not' || v.type === 'defer'){
	    d += index;
	}
	
	return {
		type: v.type,
		data: d,
		check: v.check,
		unify: v.unify?v.unify.map(function (i) {
			return i+index;
		}):undefined,
		notify: v.notify?v.notify.map(function (i) {
			return i+index;
		}):undefined
	};
}

function get (p, i) {
    if (p.data) {
        return p.data[i];
    }
    else {
        return p._get(i);
    }
}

function getValueID (p, i) {
	var v = get(p, i);
	
	if (v.type === "defer") {
		v.data = i = getValueID(p, v.data);
	}
	
	return i;
}

Writer.prototype.equal = function (i, j) {
	return getValueID(this, i) === getValueID(this, j);
};

Writer.prototype.get = function (i) {
	return this._get(getValueID(this, i));
};

Writer.prototype._get = function (i) {
    var v = this.write[i];
    
    if (!v) {
        var index = 0;
        var l = len(this.p);
        if (i < l) {
            v = get(this.p, i);
        }
        else {
            index = l;
            v = get(this.q, i - index);
        }
        
        v = copy(v, index);
        this.write[i] = v;
    }
    
    // return a safe write copy,
    return v;
};

/*
Writer.prototype.set = function (i, v) {
	// Make sure to write on index with value, not defer.
	this.write[getValueID(this, i)] = v;
};
*/

Writer.prototype.defer = function (i, j) {
	if (!this.equal(i, j)) {
		this.write[getValueID(this, i)] = {type: 'defer', data: j};	
	}
};

/*
Writer.prototype.add = function (w) {
	var i = this.writePointer++;
	this.write[i] = w;

	return i;
};
*/

function len (p) {
	if (p) {
		return p.writePointer || p.data.length;
	}
	else {
		return 0;
	}
}

Writer.prototype.ids = function (ids) {
	ids = ids || [];
	for (var i in this.write) {
		if (i < len(this.p)) {
			if (ids.indexOf(+i) === -1) {
				ids.push(+i);
			}
		}
	}
	
	return ids;
};

Writer.prototype.union = function (q) {
	var w = new Writer(this, q);

	var ids = w.q.ids(w.p.ids());
	var l = len(w.p);
	
	for (var i=0; i<ids.length; i++) {
		var id = ids[i];

		// console.log("unify(" + id + ", " + (id+l)+")");
		if (unify(w, id, id+l) === undefined) {
			// console.log("fail");
			return;
		}
	}

	// force write,
	for (var i in w.write) {
		w.forceWrite(w.write[i], i);
	}

	// everything is needed is set on w, release uneded writers.
	w.p = this.p;
	w.q = undefined;

	return w;
};

Writer.prototype.forceWrite = function (v, i, ids) {
	ids = ids || [];
	
	if (ids.indexOf(i) === -1) {
		var id;
		ids.push(i);
		if (v.type === "tuple") {
			for (var i=0; i<v.data.length; i++) {
				id = v.data[i];
				this.forceWrite(this._get(id), id, ids);
			}
		}
		else if (v.type === "not" || v.type === "defer") {
		// else if (v.type === "not") {
			this.forceWrite(this._get(v.data), v.data, ids);
		}
		
		if (v.unify) {
			for (var i=0; i<v.unify.length; i++) {
				id = v.unify[i];
				this.forceWrite(this._get(id), id, ids);
			}
		}

		if (v.notify) {
			for (var i=0; i<v.notify.length; i++) {
				id = v.notify[i];
				this.forceWrite(this._get(id), id, ids);
			}
		}
	}	
};

function commit (p, table, i, ids) {
	i = getValueID(p, i);
	var id = ids[i];
	
	if (id === undefined) {
		var v = p.get(i);

		id = table.data.findIndex(function (c) {
			return (c.type === v.type && c.data === v.data) && (v.type === 'constant' || v.type === 'ignore');
		});

		if (id !== -1) {
			ids[i] = id;
		}
		else {
			var d = {
				type: v.type,
				check: v.check
			};
			
			id = table.data.length;
			table.data.push(d);
			
			ids[i] = id;
			
			
			if (v.type === 'tuple') {
				d.data = v.data.map(function (k) {
					return commit(p, table, k, ids);
				});
			}
			else if (v.type === 'not') {
				d.data = commit(p, table, v.data, ids);
			}
			else {
				d.data = v.data;
			}
	
			if (v.unify) {
				d.unify = v.unify.map(function (k) {
					return commit(p, table, k, ids);
				});
			}
	
			if (v.notify) {
				d.notify = v.notify.map(function (k) {
					return commit(p, table, k, ids);
				});
			}
		}
	}
	
	return id;
}

Writer.prototype.commit = function () {
	
	var table = {data: [{type: "ignore"}]};
	table.start = commit(this, table, this.p.start, {0:0});
	
	return table;
};


Writer.prototype.snapshot = function () {
	return JSON.parse(JSON.stringify(this));
};

Writer.load = function (s) {
	var p, q;

	p = s.p && s.p.data?s.p:Writer.load(s.p);
	q = s.q && s.q.data?s.q:Writer.load(s.q);
	
	return new Writer(p, q, s.writePointer, s.write);
};

module.exports = Writer;
