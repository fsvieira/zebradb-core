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
		virtual: v.virtual?{
			score: v.virtual.score,
			vscore: v.virtual.vscore,
			states: v.virtual.states.slice(0),
			recursive: v.virtual.recursive.slice(0)
		}:undefined,
		check: v.check,
		unify: v.unify?v.unify+index:undefined,
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

Writer.prototype.equal = function (i, j, unify) {
	var idI = getValueID(this, i);
	var idJ = getValueID(this, j);
	
	if (idI === idJ) {
		return true;
	}

	if (unify) {
		var unifyI = this._get(idI).unify;
		var unifyJ = this._get(idJ).unify;
	
		return unifyI !== undefined && unifyI === unifyJ;
	}
	
	return false;
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

Writer.prototype.add = function (v) {
	var id = this.writePointer;
	this.write[id] = v;
	this.writePointer++;
	return id;
};

Writer.prototype.removeListenner = function (i, j, stop) {
	i = getValueID(this, i);
	j = getValueID(this, j);

	stop = stop || [];
	if (stop.indexOf(j) === -1) {
		stop.push(j);

		var v = this.get(j);
	
		if (v.notify) {
			var index = v.notify.indexOf(i);
			if (index !== -1) {
				if (v.notify.length > 1) {
					v.notify.splice(index, 1);
				}
				else {
					v.notify = undefined;
				}
			}
		}
	
		// continue the search,
		if (v.type === 'tuple') {
			for (var k=0; k<v.data.length; k++) {
				this.removeListenner(i, v.data[k], stop);
			}
		}
		else if(v.type === 'not') {
			this.removeListenner(i, v.data, stop);
		}
		
		// TODO: should listenner be set on unifies?? 		
		if (v.unify) {
			v = this.get(v.unify);
			for (var k=0; k<v.data.length; k++) {
				this.removeListenner(i, v.data[k], stop);
			}
		}
	}
};

Writer.prototype.listenner = function (i, j) {
	i = getValueID(this, i);
	j = getValueID(this, j);

	var v = this.get(j);

	if (!v.notify || v.notify.indexOf(i) === -1) {
		// if notify is not yet set on child nodes,
		if (
			i !== j
			&& (
			/*	v.type === 'tuple' || */
				v.type === 'not' ||
				v.type === 'variable' 
			)
		) {
			v.notify = v.notify || [];
			v.notify.push(i);
		}
		
		if (v.type === 'tuple') {
			for (var k=0; k<v.data.length; k++) {
				this.listenner(i, v.data[k]);
			}
		}
		else if(v.type === 'not') {
			this.listenner(i, v.data);
		}
	}
};

Writer.prototype.setUnifies = function (i, j) {
	i = getValueID(this, i);
	j = getValueID(this, j);

    if (!this.equal(i, j, true)) {

		var vi = this.get(i);
		var vj = this.get(j);
	
		var uI;
		var uJ;
		var unifies;
		var uID;
		var data;
	
		if (vj.unify !== undefined) {
			uJ = this.get(vj.unify);
			uID = vj.unify;
		}
		else if (vj.type === "unify") {
			uJ = vj;
			uID = j;
		}

		if (vi.unify !== undefined) {
			uI = this.get(vi.unify);
			uID = vi.unify;
		}
		else if (vi.type === "unify") {
			uI = vi;
			uID = i;
		}
	
		if (uI && uJ) {
			uI.data = unifies = uI.data.concat(uJ.data);
			data = uI;
			delete this.write[vj.unify || j];
		}
		else if (uI) {
			uI.data.push(j);
			unifies = uI.data;
			data = uI;
		}
		else if (uJ) {
			uJ.data.push(i);
			unifies = uJ.data;
			data = uJ;
		}
		else {
			unifies = [i, j];
			data = {type: "unify", data: unifies};
			uID = this.add(data);
		}
		
		this.write[uID] = data;
	
		for (var k=0; k<unifies.length; k++) {
			var u = unifies[k];
			var v = this.get(u);

			if (v.unify !== undefined && v.unify !== uID) {
				// remove listenner from old unify.
				this.removeListenner(v.unify, u);
				delete this.write[v.unify];
			}
			
			this.listenner(uID, u);
			v.unify = uID;
		}
		
		// updated 
		return true;
/*	
	this.listenner(i, i);
	this.listenner(j, j);
*/

	//	return uID;
    }
    
    // nothing to do,
    return false;
};


function mergeHints (a, b) {
	// vj.virtual = v.virtual || vj.virtual;
	if (a.virtual && b.virtual) {
		a.virtual.states = a.virtual.states.filter(function (i) {
			return b.virtual.states.indexOf(i) !== -1;
		});
	
		a.virtual.recursive = a.virtual.recursive.filter(function (i) {
			return b.virtual.recursive.indexOf(i) !== -1;
		});
	
		// TODO: should merge scores?
	}	
	
	a.virtual = a.virtual || b.virtual;
	b.virtual = a.virtual;
}

Writer.prototype.defer = function (i, j) {
	i = getValueID(this, i);
	j = getValueID(this, j);
	
	if (i !== j) {
		var v = this.get(i);
		var vj = this.get(j);
		
		mergeHints(v, vj);

		if (v.unify) {
			var vu = this.get(v.unify);

			vu.data.splice(vu.data.indexOf(i), 1);
			this.removeListenner(v.unify, i);

			if (vu.data.length === 1) {
				this.removeListenner(vj.unify, j);
				vj.unify = undefined;
				delete this.write[v.unify];
			}
		}

		var notifies = (v.notify || []).concat(vj.notify || []);

		this.write[i] = {type: 'defer', data: j};
		
		// notify all listenners that value as changed.
		for (var k=0; k<notifies.length; k++) {
			var u = this.get(notifies[k]);
		    for (var ki=0; ki<u.data.length; ki++) {
			    for (var kj=ki+1; kj<u.data.length; kj++) {
			        if (unify(this, u.data[ki], u.data[kj]) === undefined) {
			            return false;
			        }
			    }
		    }
		}
	}
	
	return true;
};

function len (p) {
	if (p) {
		return p.writePointer || p.data.length;
	}
	else {
		return 0;
	}
}

// superficial compare.
function cmpArray (a, b, order) {
	if (a === b) {
		return true;
	}
	
	if (a && b) {
		if (order) {
			a.sort();
			b.sort();
		}
		
		if (a.length === b.length) {
			for (var i=0; i<a.length; i++) {
				if (a[i] !== b[i]) {
					return false;
				}
			}
			
			return true;
		}
	}

	return false;
}

function cmp (a, b) {
	return (
		a.type === b.type
		&& a.check === b.check
		&& cmpArray(a.notify, b.notify, true)
		&& a.unify === b.unify
		&& ( 
			a.data === b.data || 
			(a.type === 'tuple' && cmpArray(a.data, b.data)) ||
			(a.type === 'unify' && cmpArray(a.data, b.data))
		)
	);
}

Writer.prototype.clean = function () {
	var ids = this.ids();
	
	for (var i=0; i<ids.length; i++) {
		var id = ids[i];
		
		var a = this.write[id];
		var b = get(this.p, id);
		
		if (cmp(a, b)) {
			delete this.write[id];
		}
	}
};

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
	this.clean();
	q.clean();
	
	var w = new Writer(this, q);

	var ids = w.q.ids(w.p.ids());
	var l = len(w.p);

	for (var i=0; i<ids.length; i++) {
		var id = ids[i];

		if (unify(w, id, id+l) === undefined) {
			return;
		}
	}

	// force write,
	for (var i in w.write) {
		w.forceWrite(w.write[i], +i);
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
		
		
		if (v.unify !== undefined) {
			var u = this._get(v.unify).data;
			for (var i=0; i<u.length; i++) {
				id = u[i];
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
//			return (c.type === v.type && c.data === v.data && c.unify === v.unify) && (v.type === 'constant' || v.type === 'ignore');
//			return (c.type === v.type && c.data === v.data) && (v.type === 'constant' || v.type === 'ignore');
			return (c.type === v.type && c.data === v.data && v.type === 'ignore');
		});

		if (id !== -1) {
			ids[i] = id;
		}
		else {
			var d = {
				type: v.type,
				check: v.check,
				virtual: v.virtual
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
			else if (v.type === 'unify') {
				d.data = v.data.map(function (k) {
					return commit(p, table, k, ids);
				});
				
				//console.log("COMMIT: " + v.data.sort().join(", ") + " === " + d.data.sort().join(", "));
			}
			else {
				d.data = v.data;
			}
	
			if (v.unify !== undefined) {
				d.unify = commit(p, table, v.unify, ids);
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

Writer.prototype.commit = function (start) {
	var table = {data: [{type: "ignore"}]};
	start = (start === undefined)?this.p.start:start;
	
	table.start = commit(this, table, start, {0:0});

	return table;
};


/*
	Debug functions.
*/

Writer.prototype.snapshot = function () {
	return JSON.parse(JSON.stringify(this));
};


var debug=0;
Writer.prototype.debug_check = function (msg) {
	// check that all unifies are type unify.

	console.log("debug=" + debug++);
	console.log("debug snapshoot=" + JSON.stringify(this.snapshot()));
	
	var unifiesCount = {};
	
	for (var i in this.write) {
		i = +i;
		var v = this.get(i);
	
		if (v && v.unify) {
			var vu = this.get(v.unify);

			if (vu.type !== 'unify') {
				// console.log("BAD UNIFY");
				console.log(msg + "; BAD UNIFY (i: "+i+",u: " + v.unify +"): " + JSON.stringify(this.snapshot()));
				throw msg + "; BAD UNIFY: " + JSON.stringify(this.snapshot());
				// return false;
			}
			else {
				// check that all unifies are not defers or unify
				for (var j=0; j<vu.data.length; j++) {
					unifiesCount[vu.data[j]] = unifiesCount[vu.data[j]] || [];
					if (unifiesCount[vu.data[j]].indexOf(v.unify) === -1) {
						unifiesCount[vu.data[j]].push(v.unify);
						
						if (unifiesCount[vu.data[j]].length > 1) {
							console.log(msg + " BAD UNIFY ELEMENT IN MULTIPLE UNIFIES. "+vu.data[j]+" = [" + unifiesCount[vu.data[j]].join(", ") + "]; " + JSON.stringify(this.snapshot()));
							throw msg + " BAD UNIFY ELEMENT IN MULTIPLE UNIFIES. "+vu.data[j]+" = [" + unifiesCount[vu.data[j]].join(", ") + "]; " +  + JSON.stringify(this.snapshot());
						}
					}

					var u = this.get(vu.data[j]);
					if ((u.type === "unify") || (u.type === "defer") || (u.type === undefined)) {
						console.log(msg + "; BAD ELEMENT "+u.type+" UNIFY (i: "+i+",u: " + v.unify +", e: " + vu.data[j] + "): " + JSON.stringify(this.snapshot()));
						throw msg + "; BAD ELEMENT "+u.type+" UNIFY: " + JSON.stringify(this.snapshot());
					}
				}
			}
		}
	}
	
	return true;
};


Writer.load = function (s) {
	var p, q;

	p = s.p && s.p.data?s.p:Writer.load(s.p);
	q = s.q && s.q.data?s.q:Writer.load(s.q);
	
	return new Writer(p, q, s.writePointer, s.write);
};


module.exports = Writer;
