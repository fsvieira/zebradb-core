const Ids = require("./ids");

class Branches {
    
    constructor (events) {
        this.ids = new Ids();
        
        this.branches = {};
        this.events = events;
        this.root = this.branchHash({
            action: "init",
            level: 0
        });
        
        // events.trigger('branch', {brancId: this.root});
    }
    
    branchHash (obj) {
        Object.freeze(obj);
        const id = this.ids.id(obj);
        
        if (!this.branches[id]) {
            this.branches[id] = {
    	        data: obj,
    	        metadata: {
    	        	changes: {},
    	        	counter: 0
    	        }
    	    };
        }
        
        if (obj.parent !== undefined) {
            var parents;
            
            if (obj.parent instanceof Array) {
                parents = obj.parent;
            }
            else {
                parents = [obj.parent];
            }
            
            parents.forEach(parentBranchId => {
                const branch = this.getRawBranch(parentBranchId);
               
                branch.metadata.status = branch.metadata.status || {};
               
                if (!branch.metadata.status.closed) {
                   branch.metadata.status.closed = true;
                   Object.freeze(branch.metadata.changes);
                   
                   this.events.trigger("branch", {branchId: parentBranchId});
                }
            });
        }
        
        return id;
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
    			if (typeof b.data.parent === 'number') {
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
    
    end (branchId, fail, reason) {
        var branch = this.getRawBranch(branchId);
        
        branch.metadata.status = branch.metadata.status || {};
        
        branch.metadata.status.end = true;
        branch.metadata.status.fail = fail;
        branch.metadata.status.reason = reason;
        
        if (!branch.metadata.status.closed) {
            branch.metadata.status.closed = true;
            
            Object.freeze(branch.metadata.changes);
            
            this.events.trigger("branch", {branchId});
        }

    	this.events.trigger("branch-end", {branchId, fail, reason});
    }

    getUniqueId (id) {
        return id + "$" + this.getRawBranch(id).metadata.counter++;
    }
}


module.exports = Branches;
