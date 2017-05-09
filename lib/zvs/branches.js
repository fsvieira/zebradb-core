const crypto = require("crypto");


class Branches {
    
    constructor () {
        this.branches = {};
        this.root = this.branchHash({
            action: 'init',
            level: 0
        });
    }
    
    branchHash (obj) {
        Object.freeze(obj);
    	var hash = crypto.createHash('sha1').update(JSON.stringify(obj)).digest('hex');
    	var o;
    	var i=0;
    
        var objStr = JSON.stringify(obj);
    
    	// Prevent hash clashing,
    	for(;;) {
    		o = this.branches[hash];
    		
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
    	
    	var branch = this.branches[hash];
    	if (!branch) {
    	    branch = this.branches[hash] = {
    	        data: obj,
    	        metadata: {
    	        	changes: {},
    	        	counter: 0
    	        }
    	    };
    	}
    	
    	return hash;
    }
    
    getRawBranch (id) {
	    return this.branches[id];
    }

    getBranch (id) {
	    var branch = this.getRawBranch(id);
	    return branch?branch.data:undefined;
    }
    
    
    getDataId (branchId, id) {
    	var c, b;
    	var bh = branchId;
    	
    	do {
    		id = c || id;
    		b = this.getRawBranch(bh);
    		c = b.metadata.changes[id];
    		
    		if (c === undefined) {
    			if (typeof b.data.parent === 'string') {
    				bh = b.data.parent;
    			}
    			else {
    				c = id;
    			}
    		}
    		else {
    			bh = branchId;
    		}
    	} while (c !== id);
    	
    	return c;
    }


    transform (branchId, oldId, newId) {
    	oldId = this.getDataId(branchId, oldId);
    	newId = this.getDataId(branchId, newId);
    	if (oldId !== newId) {
    		this.getRawBranch(branchId).metadata.changes[oldId] = newId;
    	}
    }
    
    getLevel (id) {
        return this.getBranch(id).level;
    }
    
    notes (branchId, notes) {
    	var branch = this.getRawBranch(branchId);
    	branch.metadata.notes = branch.metadata.notes || {};
    	Object.assign(branch.metadata.notes, notes);
    }
    
    getUniqueId (id) {
        return id + "$" + this.getRawBranch(id).metadata.counter++;
    }
}


module.exports = Branches;
