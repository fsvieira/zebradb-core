/*
    Override zquery methods with checks and stuff :D
*/
var ZQuery = require("./zquery");
var should = require("should");
var fs = require("fs");

function ErrorMatchMessage (message, match) {
  this.match = match;
  this.name = "ErrorMatchMessage";
  this.message = message || 'Error Match Message';
}

ErrorMatchMessage.prototype = Object.create(Error.prototype);
ErrorMatchMessage.prototype.constructor = ErrorMatchMessage;


function Logger (options) {
    options = options || {};
    this.root = [];
    this.stack = [];
    this.stack.push(this.root);

    function checkMessage (m) {
        if (options.exceptions) 
        for (var e in options.exceptions) {
            var t = true;
            for (var field in options.exceptions[e]) {
                if (options.exceptions[e][field] !== m[field]) {
                    t = false;
                    break;                    
                }
            }
            
            if (t) {
                throw new ErrorMatchMessage("message match exception: " + JSON.stringify(m), m);
            }
        }
    }
  
    this.start = function () {
        var env = [];
        this.stack[this.stack.length-1].push(env);
        this.stack.push(env);
    };
  
    this.end = function () {
        var last = this.stack.pop();
            
        if (last.length === 0) {
            var father = this.stack[this.stack.length-1];
            father.splice(father.indexOf(last), 1);
        }
    };
  
    this.message = function (msg, status) {
        if (!options.status || options.status.indexOf(status) !== -1) {
            var m = {
                message: msg,
                status: status
            };
            
            this.stack[this.stack.length-1].push(m);
            checkMessage(m);
        }
    };
  
    this.toString = function (root) {
        root = root || this.root;
        return JSON.stringify(root, null, "\t");
    };
    
}

function logger (f, options) {
    options = options || {};

    var log = new Logger(options);

    var vunify = ZQuery.Variable.prototype.unify;
    ZQuery.Variable.prototype.unify = function (v) {
        
        log.message("variable unify start: " + this.toString() + " <=> " + v.toString(), "START");
        log.start();
        var r = vunify.call(this, v);
        log.end();
        log.message(
            "variable unify end: " + this.toString() + " <=> " + v.toString()
            , "VAR_UNIFY_" + r.toString().toUpperCase()
        );
    
        should(r).be.type("boolean");
        return r;
    };
    
    var _vunify = ZQuery.Variable.prototype._unify;
    var __vunify = function (v) {
    	if (this.share.equals.indexOf(v) === -1) {
    		this.share.equals.push(v);
    		
    		for (var i=0; i<this.share.equals.length; i++) {
    			if (!this.share.equals[i]._unify(v)) {
    			    log.message("variable equals: " + this.share.equals[i].toString() + "<=>" + v.toString(), 
    			        "VAR_UNIFY_FALSE"
    			    );
    				return false; // unable to unify variable.
    			}
    		}
    			
    		for (var i=0; i<this.share.notEquals.length; i++) {
    			if (!this.share.notEquals[i]._notUnify(v)) {
    				return false; // unable to not-unify variable.
    			}
    		}
    		
    		return v._unify(this);
    	}
    
    	return true;
    };
    
    ZQuery.Variable.prototype._unify = function (v) {
        
        log.message("variable _unify start: " + this.toString() + " <=> " + v.toString(), "START");
        log.start();
        var r = __vunify.call(this, v);
        log.end();
        log.message(
            "variable _unify end: " + this.toString() + " <=> " + v.toString()
            , "VAR_UNIFY_" + r.toString().toUpperCase()
        );
    
        should(r).be.type("boolean");
        return r;
    };
    
    var tunify = ZQuery.Tuple.prototype.unify;
    ZQuery.Tuple.prototype.unify = function (v) {
        log.message("tuple unify start: " + this.toString() + " <=> " + v.toString(), "START");
        log.start();
    
        var r = tunify.call(this, v);
        log.end();
        log.message(
            "tuple unify end:  " + this.toString() + " <=> " + v.toString()
            , "TUPLE_UNIFY_" + r.toString().toUpperCase()
        );
        should(r).be.type("boolean");
        return r;
    };
    
    var cunify = ZQuery.Constant.prototype.unify;
    ZQuery.Constant.prototype.unify = function (v) {
        log.message("constant unify start: " + this.toString() + " <=> " + v.toString(), "START");
        log.start();
        var r = cunify.call(this, v);
        log.end();
        log.message(
            "constant unify end: " + this.toString() + " <=> " + v.toString()
            , "CONST_UNIFY_" + r.toString().toUpperCase()
        );
        should(r).be.type("boolean");
        return r;
    };
    
    var rquery = ZQuery.Run.prototype._query;
    ZQuery.Run.prototype._query = function (tuple, callback) {
        log.message("query start:" + tuple.toString(), "START");
        log.start();
        rquery.call(this, tuple, callback);
        log.end();
        log.message("query end: " + tuple.toString(), "END");
    };
    

    var csave = ZQuery.Context.prototype.save;
    ZQuery.Context.prototype.save = function () {
        log.message("save start");
        csave.call(this);
        log.message(this.toString());
        log.start();
    
        // log.message("save end");
        // log.end();
    };
    
    var cload = ZQuery.Context.prototype.load;
    ZQuery.Context.prototype.load = function () {
        // log.start();
        log.end();
        log.message("load start");
        log.message(this.toString());
        cload.call(this);
        // log.message("load end");
    };

    var error;
    try {
        f();
    }
    catch (err) {
        error = err;
    }

    if (options && options.log) {
        fs.writeFile(options.log, log.toString());
    }
    else {
        console.log(log.toString());
    }
    
    if (
        (error instanceof ErrorMatchMessage) &&
        options.testcase
    ) {
        console.log("gen testcase: " + options.testcase);
    }
     
    ZQuery.Variable.prototype.unify = vunify;
    ZQuery.Tuple.prototype.unify = tunify;
    ZQuery.Constant.prototype.unify = cunify;
    ZQuery.Run.prototype._query = rquery;
    ZQuery.Context.prototype.save = csave;
    ZQuery.Context.prototype.load = cload;
    
    if (error) {
        throw error;
    }
}

module.exports = {
    logger: logger
};

/*
module.exports = {
    Run: ZQuery.Run,
    Variable: ZQuery.Variable,
    Tuple: ZQuery.Tuple,
    Constant: ZQuery.Constant,
    Context: ZQuery.Context,
    create: ZQuery.create
};
*/
