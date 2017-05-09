const crypto = require('crypto');

class Data {
    
    constructor () {
        this.data = {};
        this.globals = {};
    }
    
    /* 
    data-hash:
        1. sha1 (obj),
        2. check with unavailable-sha1 contraints,
        3. compare with object using with that sha1 (use get)
    */
    dataHash (obj) {
        Object.freeze(obj);
    	var hash = crypto.createHash('sha1').update(JSON.stringify(obj) || "undefined").digest('hex');
    	var o;
    	var i=0;
    
        var objStr = obj; 
    	if (obj instanceof Array || typeof obj === 'object') {
    		objStr = JSON.stringify(obj);
    	}
    	
    	// Prevent hash clashing,
    	for(;;) {
    		o = this.data[hash];
    		
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
    	
    	if (!this.data[hash]) {
    	    this.data[hash] = {
    	        data: obj
    	    };
    	}

    	return hash;
    }
    
    add (obj) {
        var r = obj;
    	var self = this;
    	
    	if (obj instanceof Array) {
    		r = obj.map(
    			function (o) {
    				return self.add(o);	
    			}
    		);
    		
    		r = this.dataHash(r);
    	}
    	else if (typeof obj === 'object') {
    		r = {};
    		for (var i in obj) {
    			r[i] = this.add(obj[i]);
    		}
    			
    		r = this.dataHash(r);
    	}
    	else {
    		r = this.dataHash(r);
    	}
    	
    	return r;
    }
    
    get (id) {
	    return this.data[id];
    }
    
    global (name) {
    	var globalHash = this.globals[name];
    
    	if (!globalHash) {
    		globalHash = this.add({global: name});
    		this.globals[name] = globalHash;
    	}
    
    	return globalHash;
    }
}

module.exports = Data;
