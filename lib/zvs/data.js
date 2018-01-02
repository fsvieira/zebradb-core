const Ids = require("./ids");

class Data {

    constructor (events) {
        this.ids = new Ids();

        this.data = {};
        this.globals = {};
        this.events = events;
    }

    getId (obj) {
        Object.freeze(obj);

        const id = this.ids.id(obj);

        if (!this.data[id]) {
            this.data[id] = {
    	        data: obj
    	    };
        }

        return id;
    }

    add (obj) {
        let r = obj;

    	if (obj instanceof Array) {
    		r = obj.map(
    			o => {
    				return this.add(o);
    			}
    		);

    		r = this.getId(r);
    	}
    	else if (typeof obj === "object") {
    		r = {};
    		for (let i in obj) {
    			if (obj.hasOwnProperty(i)) {
    				r[i] = this.add(obj[i]);
    			}
    		}

    		r = this.getId(r);
    	}
    	else {
    		r = this.getId(r);
    	}

    	return r;
    }

    get (id) {
	    return this.data[id];
    }

    global (name) {
    	let globalHash = this.globals[name];

    	if (!globalHash) {
    		globalHash = this.add({global: name});
    		this.globals[name] = globalHash;
    	}

    	return globalHash;
    }
}

module.exports = Data;
