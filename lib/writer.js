var unify = require("./unify");

var Writer = function (p, q) {
    this.p = p;
    this.q = q;
    
    this.writePointer = len(p) + len(q);
    
    this.write = {};
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
		check: v.check
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

Writer.prototype.set = function (i, v) {
	// Make sure to write on index with value, not defer.
	this.write[getValueID(this, i)] = v;
};

Writer.prototype.add = function (w) {
	var i = this.writePointer++;
	this.write[i] = w;

	return i;
};

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
		ids.push(i);
		if (v.type === "tuple" || v.type === "unify") {
			for (var i=0; i<v.data.length; i++) {
				var id = v.data[i];
				this.forceWrite(this.get(id), id, ids);
			}
		}
		// else if (v.type === "not" || v.type === "defer") {
		else if (v.type === "not") {
			this.forceWrite(this.get(v.data), v.data, ids);
		}
	}	
};

Writer.prototype.commit = function () {
	// TODO: make clean here.
	var p = this.p;
	var r = {
		start: p.start,
		data: p.data.slice(0)
	};

	for (var i in this.write) {
		this.forceWrite(this.write[i], i);
	}

	for (var i in this.write) {
		r.data[+i] = this.write[i];
	}
	
	return r;
};

module.exports = Writer;
