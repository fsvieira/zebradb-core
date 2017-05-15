var zparser = require("./zparser");
var ZVS = require("./zvs/zvs");
var unify = require("./unify");
var utils = require("./utils");
var prepare = require("./prepare");
var negation = require("./negation");
var graph = require("./graph");
var planner = require("./planner");
var fs = require("fs");

function negations (zvs, branchId, ns) {
    var query = zvs.data.global("query");
    var queryObj = zvs.getData(branchId, query);
    var negations = prepare.union(zvs, branchId, zvs.getData(branchId, ns) || [], zvs.getData(branchId, queryObj.negation) || []);

    zvs.update(branchId, query, {negation: negations});
    return negation(zvs, branchId);
}

function check (zvs, branchId, q, defs) {
    var r = [];

    var virtual = zvs.getObject(branchId, q).virtual;
    
    if (virtual) {
        defs = defs.filter(function (d) {
           var code = d.virtual.code;
           
           return virtual.transitions.indexOf(code) !== -1;
        });
    }

    for (var i=0; i<defs.length; i++) {
        var c = prepare.copyWithVars(defs[i], {
            uniqueId: function () {
                return zvs.branches.getUniqueId(branchId);
            }
        });
        var negation = c.negation;
        
        delete c.negation;
        var def = zvs.data.add(c);
        
        var branch = zvs.change(branchId, "unify", [q, def]);

        if (branch && negation && negation.length > 0) {
            var n = zvs.data.add(negation);
            branch = zvs.change(branch, "negations", [n]);
        }

        if (branch) {
            r = r.concat(branch);
        }
    }
    
    return r;
}


function query (zvs, branchId, q) {
    var r = [];
    var bs, branches;

    if (q) {
        zvs.branches.transform(branchId, zvs.data.global("query"), q);
    }
    else {
        q = zvs.data.global("query");
    }

    var settings = zvs.getObject(branchId, zvs.data.global("settings"));
    var defs = zvs.getObject(branchId, zvs.data.global("definitions")).definitions;

    if (settings.deep && zvs.branches.getLevel(branchId) > settings.deep) {
        zvs.branches.notes(branchId, {status: {fail: true, reason: "max deep limits exceded!"}});
        return;
    }

    if (!negation(zvs, branchId, true)) {
        return;
    }

    // choose tuples to evaluate,
    var tuples = planner(zvs, branchId, q);

    if (tuples && tuples.length > 0) {

        for (var i=0; i<tuples.length; i++) {
            branches = check(zvs, branchId, tuples[i], defs);
            
            if (branches.length === 0) {
                // fail
                zvs.branches.notes(branchId, {status: {fail: true, reason: "check fail!"}});
                return;
            }
            else {
                r.push(branches);
            }
        }
        
        while (r.length > 1) {
            var a = r.pop();
            var b = r.pop();
    
            var nr = [];

            for (var i=0; i<a.length; i++) {
                var bA = a[i];
                for (var j=0; j<b.length; j++) {
                    var bB = b[j];
                    
                    // bA * bB
                    bs = zvs.merge([bA, bB], "mergeConflictHandler");
                    
                    if (bs && bs.length) {
                        for (var bi=bs.length-1; bi>=0; bi--) {
                            if (!negation(zvs, bs[bi])) {
                                bs.splice(bi, 1);
                            }
                        }
                    
                        nr = nr.concat(bs);
                    }
                }
            }

            
            if (nr.length === 0) {
                // fail,
                zvs.branches.notes(branchId, {status: {fail: true, reason: "merge fail!"}});
                return;    
            }
            
            r.push(nr);
        }
        
        r = r[0];
    }
    else {
        return [branchId];
    }


    branches = undefined;
    if (r.length > 0) {
        branches = [];
        for (var i=0; i<r.length; i++) {
            bs = zvs.change(
                r[i],
                "query", 
                []
            );
            
            if (bs) {
                for (var j=0; j<bs.length; j++) {
                    if (branches.indexOf(bs[j]) === -1) {
                        branches.push(bs[j]);
                    }
                }
            }
        }
    }
    else {
        zvs.branches.notes(branchId, {status: {fail: true, reason: "no results!"}});
    }

    return branches;
}



function definitions (zvs, branchId, defsHash) {
    var defs = zvs.getData(branchId, defsHash);

    defs = prepare.uniq_fast(defs);

    var definitionsList = defs.map(function (d) {
        return zvs.getObject(branchId, d);
    });


    zvs.update(branchId, zvs.data.global("definitions"), {definitions: definitionsList});
    
    return true;
}

function Run (deep) {
    this.fs = fs;
    this.definitions = [];
    this.definitionsCodes = [];
    
    this.zvs = new ZVS()
        .action("definitions", definitions)
        .action("query", query)
        .action("negations", negations)
        .action("unify", function (zvs, branchId, p, q) {
            return unify(zvs, branchId, p, q, true);
        })
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

        var branch = this.zvs.change(
            this.zvs.branches.root,
            "definitions", [
                this.zvs.data.add(preDefs)
            ]
        );
        
        result = {
            definitions: branch
        };

        result.queries = {};

        for (var i=0; i<defs.queries.length; i++) {
            var q = this.zvs.data.add(
                prepare.query(defs.queries[i])
            );

            var r = this.zvs.change(
                branch,
                "query",
                [q]
            );

            // r = this.multiply(r);
            
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