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

function cmp (p, q) {
	if (p.type === q.type) {
		if (
			(p.type === 'unify' || p.type === 'tuple') 
			&& (p.data.length === q.data.length)
		) {
			if (p.type === 'unify') {
				p.data.sort();
				q.data.sort();
			}
				
			for (var j=0; j<p.data.length; j++) {
				if (p.data[j] !== q.data[j]) {
					return false;
				}
			}
			
			return true;
		}
		else {
			return p.data === q.data;
		}
	}
	
	return false;
}

function get (p, i) {
    if (p.data) {
        return p.data[i];
    }
    else {
        return p.get(i);
    }
}

Writer.prototype.get = function (i) {
    
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
	this.write[i] = v;
};

Writer.prototype.add = function (w) {
	var i = this.writePointer++;
	this.write[i] = w;

	return i;
};

function len (p) {
	return p.writePointer || p.data.length;
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

		console.log("unify(" + id + ", " + (id+l)+")");
		if (!unify(w, id, id+l)) {
			console.log("fail");
			return;
		}
	}
	
	return w;
};

// TODO: rebase, and clean unused resources, this function should not be needed.
Writer.prototype.base = function () {
	if (this.p.data) {
		return this.p;
	}

	return this.p.base();
};

Writer.prototype.commit = function () {
	var p = this.base();
	var r = {
		start: p.start,
		data: p.data.slice(0)
	};
	
	for (var i in this.write) {
		r.data[+i] = this.write[i];
	}
	
	return r;
};

Writer.prototype.clean = function () {
	// TODO:
	// 1 - remove q,
	// 2 - remove defers,
	// 3 - clean unchanged p data.
	// --> "clean" data, reajust write pointer, mark tables to change or not change (this will make clean unchanged p data stupid!!).

	for (var i in this.write) {
		var p = this.write[i];
		var q = this.get(i);
		
		if (cmp(p, q)) {
			delete this.write[i];
		}
	}
	
	return this;
};

module.exports = Writer;
