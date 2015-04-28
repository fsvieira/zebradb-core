/*
    Override zquery methods with checks and stuff :D
*/
var ZQuery = require("./zquery");
var should = require("should");

function Logger () {
  this.root = [];
  this.stack = [];
  
  this.stack.push(this.root);
  
  this.start = function () {
    var env = [];
    this.stack[this.stack.length-1].push(env);
    this.stack.push(env);
  };
  
  this.end = function () {
    if (this.stack.length > 1) {
      this.stack.pop();
    }
  };
  
  this.message = function (msg) {
    console.log(msg.toString());
    this.stack[this.stack.length-1].push(msg);
  };
  
  this.toString = function () {
      return JSON.stringify(this.root, null, "\t");
  };
}

var logger = new Logger();

var vunify = ZQuery.Variable.prototype.unify;
ZQuery.Variable.prototype.unify = function (v) {
    logger.start();
    logger.message("variable unify start: " + this.toString() + " <=> " + v.toString());

    var r = vunify.call(this, v);
    logger.message("variable unify end: [" + r + "]: " + this.toString() + " <=> " + v.toString());

    should(r).be.type("boolean");
    logger.end();
    return r;
};

var tunify = ZQuery.Tuple.prototype.unify;
ZQuery.Tuple.prototype.unify = function (v) {
    logger.start();
    logger.message("tuple unify start: " + this.toString() + " <=> " + v.toString());
    var r = tunify.call(this, v);
    logger.message("tuple unify end [" + r + "]: " + this.toString() + " <=> " + v.toString());
    
    should(r).be.type("boolean");
    logger.end();
    return r;
};

var cunify = ZQuery.Constant.prototype.unify;
ZQuery.Constant.prototype.unify = function (v) {
    logger.start();
    logger.message("constant unify start: " + this.toString() + " <=> " + v.toString());
    var r = cunify.call(this, v);
    logger.message("constant unify end [" + r + "]: " + this.toString() + " <=> " + v.toString());
    
    should(r).be.type("boolean");
    logger.end();
    return r;
};

var rquery = ZQuery.Run.prototype._query;
ZQuery.Run.prototype._query = function (tuple, callback) {
    logger.start();
    logger.message("query start");
    logger.message(tuple.toString());
    rquery.call(this, tuple, callback);
    logger.message("query end");
    logger.end();
};

var csave = ZQuery.Context.prototype.save;
ZQuery.Context.prototype.save = function () {
    logger.message("save start");
    csave.call(this);
    logger.message(this.toString());
    logger.start();

    // logger.message("save end");
    // logger.end();
};

var cload = ZQuery.Context.prototype.load;
ZQuery.Context.prototype.load = function () {
    // logger.start();
    logger.end();
    logger.message("load start");
    logger.message(this.toString());
    cload.call(this);
    // logger.message("load end");
    
};

ZQuery.Context.prototype.toString = function () {
    var s = "";
    if (this.versions.length > 0) {
        var version = this.versions[this.versions.length-1];
        for (var i=0; i< version.length; i++) {
          s += shareToString(version[i]) + "\n";
        }
    }
    
    return s;
};

function shareToString (share) {
    var result = {};
    for (var group in share) {
        var variables = share[group];
        result[group] = [];
        
        for (var i=0; i<variables.length; i++) {
            result[group].push(variables[i].toString());
        }
    }
    
    return JSON.stringify(result);
}


ZQuery.Run.logger = logger;



module.exports = {
    Run: ZQuery.Run,
    Variable: ZQuery.Variable,
    Tuple: ZQuery.Tuple,
    Constant: ZQuery.Constant,
    Context: ZQuery.Context,
    create: ZQuery.create
};

