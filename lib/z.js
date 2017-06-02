var query = require("./actions/query");
var definitions = require("./actions/definitions");

var zparser = require("./zparser");
var ZVS = require("./zvs/zvs");
var unify = require("./unify");
var utils = require("./utils");
var prepare = require("./prepare");
var graph = require("./graph");
var fs = require("fs");


function Run (deep) {
    this.fs = fs;
    this.definitions = [];
    this.definitionsCodes = [];
    
    this.zvs = new ZVS()
        // .action("definitions", definitions)
        // .action("query", query)
        // .action("negations", negations)
        /*.action("unify", function (zvs, branchId, p, q) {
            return unify(zvs, branchId, p, q, true);
        })*/
        .action("mergeConflictHandler", function (zvs, branchId, p, q) {
            return unify(zvs, branchId, p, q, false);
        });

    // Setup globals,
    this.zvs.branches.transform(
        this.zvs.branches.root,
        this.zvs.data.global("settings"),
        this.zvs.data.add({type: 'settings', deep: deep})
    );
}

function zlib (dir) {
    dir = dir || "";
    if (fs.existsSync("zlib/")) {
        return dir + "zlib/";
    }
    else {
        return zlib("../");
    }
}


Run.prototype.parse = function (defs, includes) {
    includes = includes || [];

    var includeDefs;
    
    if (defs) {
        if (typeof defs === 'string') {
            try {
        		defs = zparser.parse(defs);
            }
            catch (e) {
                throw "line=" + e.location.start.line + ", column=" + e.location.start.column + ": " + e.message;
            }
        		
            for (var i=0; i<defs.length; i++) {
                var d = defs[i];

                if (d.type === 'include' && includes.indexOf(d.data) === -1) {
                    includes.push(d.data);
                    // TODO: transform everything to async (promisse),
                    // TODO: make driver find zlib dir.
                    var data = this.fs.readFileSync(zlib() + d.data + '.z').toString();
                    try {
                        includeDefs = zparser.parse(data);
                    }
                    catch (e) {
                        throw "line=" + e.location.start.line + ", column=" + e.location.start.column + ": " + e.message;
                    }

                    defs = defs.concat(includeDefs);
                }
            }
    
            // remove all includes,
            defs = defs.filter(function (d) {
                return d.type !== 'include';
            });

    		defs = {
    		    definitions: defs.filter(function (def) {
    		        return def.type !== 'query';
    		    }),
    		    queries: defs.filter(function (def) {
    		        return def.type === 'query';
    		    }).map(function (q) {
    		        return q.data;
    		    })
    		};
    	}
    	else {
    	    defs = prepare.clone(defs);
    	}
    }

    return defs;  
};

// TODO: return a promisse!!
Run.prototype.add = function (defs) {
    var result;
    
    defs = this.parse(defs);

    this.definitions = this.definitions.concat(defs.definitions || defs);

    if (defs.queries && defs.queries.length > 0) {
        var preDefs = prepare.definitions(this.definitions);

        preDefs = graph(preDefs).definitions;

        const branchId = definitions(this.zvs, {branchId: this.zvs.branches.root, args: [this.zvs.data.add(preDefs)]});
        
        result = {
            definitions: branchId
        };

        result.queries = {};

        for (var i=0; i<defs.queries.length; i++) {
            var q = this.zvs.data.add(
                prepare.query(defs.queries[i])
            );

            var r = query(this.zvs, {branchId, args: [q]});
            
            if (r && r.length > 0) {
                result.queries[q] = r;
            }
        }

    }
    
    return result;
};

Run.prototype.query = function (defs) {
    var r = this.add(defs);
    var b, o;
    
    var objs = [];
    var dups = {};

    if (r.queries) {
        var queryHash = this.zvs.data.global("query");
        // var dups = {};
        
        for (var query in r.queries) {
            var branches = r.queries[query];
            // var ids = [];
            for (var i=0; i< branches.length; i++) {
                b = branches[i];

                /*
                    This doens't work because ID may not change when inner ID's 
                    change. 
                    Ex:
                        (yellow 'x)
                    
                    When 'x is changed the parent ID may remain the same.
                */
                /*
                var id = this.zvs.getId(b, queryHash);
                
                console.log("branch=" + b + " queryHash=" + queryHash + " id=" + id);
                
                if (ids.indexOf(id) === -1) {
                    ids.push(id);
                    objs.push(this.zvs.getObject(id, b));
                }
                */

                o = this.zvs.getObject(
                    b,
                    queryHash
                );
                
                // console.log(utils.toString(o, true));
                
                // objs.push(o);
                var s = utils.toString(o, true);
                
                if (!dups[s]) {
                    dups[s] = true;
                    objs.push(o);
                }
            }
        }
    }
    
    return objs;
};

Run.prototype.print = function (defs) {
    var results = this.query(defs).map(function (o) {
        return utils.toString(o, true);
    });
    
    results.sort();
    return results.join('\n');
};

module.exports = Run;