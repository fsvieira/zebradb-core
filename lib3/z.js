// TODO: make a new parser with pegjs

// var zparser = require("../lib/zparser");
var zparser = require("./zparser");
var ZVS = require("./zvs");
var unify = require("./unify");
var utils = require("./utils");
var prepare = require("./prepare");
var negation = require("./negation");


function planner (q, b, tuples) {
    // normalize id,
    q = b.getId(q);
    
    tuples = tuples || [];
    
    if (tuples.indexOf(q) === -1) {
        var d = b.get(q);
    
        if (b.get(d.type) === 'tuple') {
            if (!d.check || !b.get(d.check)) {
                tuples.push(q);
            }
            
            var data = b.get(d.data);
            for (var i=0; i<data.length; i++) {
                planner(data[i], b, tuples);
            }
        }
    }
    
    return tuples;
}

function check (q, defs, b) {
    var r = [];

    for (var i=0; i<defs.length; i++) {
        var c = prepare.copyWithVars(b.getObject(defs[i]), b);
        var def = b.add(c);
        
        var branch = b.change("unify", [q, def]);

        if (branch) {
            // convervative check,
            // this.zvs.update(b, q, {check: true});
            r = r.concat(branch);
        }
    }
    
    return r;
}

/*function mergeConflictResolver (p, q, branch) {
    return unify(p, q, branch, false);
}*/

function query (q, globalsHash) {
    var r = [];
    var bs, branches;

    // TODO: setup deep on query, delete settings, as they are not needed.
    var settings = this.getObject(this.zvs.global("settings"));

    var globals = this.get(globalsHash);
    var defs = this.get(globals.definitions);
    this.update(globalsHash, {query: this.getObject(q)});

    if (settings.deep && this.getLevel() > settings.deep) {
        this.notes({status: {fail: true, reason: "max deep limits exceded!"}});
        return;
    }


    // choose tuples to evaluate,
    var tuples = planner(q, this);
    
    if (tuples && tuples.length > 0) {
        for (var i=0; i<tuples.length; i++) {
            branches = check(tuples[i], defs, this);
            
            if (branches.length === 0) {
                // fail
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
                    bs = this.zvs.merge([bA, bB], "mergeConflictHandler"); // mergeConflictResolver);
                    
                    // TODO: put negation inside merge, since now its a contained function.
                    if (bs && bs.length) {
                        for (var bi=bs.length-1; bi>=0; bi--) {
                            if (!negation(this.hash2branch(bs[bi]))) {
                                bs.splice(bi, 1);
                            }
                        }
                    
                        nr = nr.concat(bs);
                    }
                }
            }
            
            if (nr.length === 0) {
                // fail,
                return;    
            }
            
            r.push(nr);
        }
        
        r = r[0];
    }
    else {
        return [this.id];
    }

    branches = undefined;
    if (r.length > 0) {
        branches = [];
        for (var i=0; i<r.length; i++) {
            bs = this.change(
                "query", [
                    q,
                    globalsHash
                ], 
                r[i]
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

    return branches;
}

function definitions (defsHash, globalsHash) {
    var defs = this.getObject(defsHash);
    var globals = this.getObject(globalsHash);
    
    globals.definitions = globals.definitions || [];

    for (var i=0; i<defs.length; i++) {
        var d = defs[i];
        if (globals.definitions.indexOf(d) === -1) {
            globals.definitions.push(d);
        }
    }
    
    // update definitions,
    this.update(globalsHash, {definitions: globals.definitions});
    
    return true;
}

function Run (deep) {
    this.definitions = [];
    this.definitionsCodes = [];
    
    this.zvs = new ZVS()
        .action("definitions", definitions)
        .action("query", query)
        .action("unify", function (p, q) {
            return unify(p, q, this, true);
        })
        .action("mergeConflictHandler", function (p, q) {
            return unify(p, q, this, false);
        });


    // Store global data on zvs,
    // this.globalsHash = this.zvs.add({type: "globals"});
    this.globalsHash = this.zvs.global('globals', {type: "globals"});
    this.zvs.global("settings", {type: 'settings', deep: deep});
}


Run.prototype.parse = function (defs) {
    if (defs) {
        if (typeof defs === 'string') {
    		defs = zparser.parse(defs);
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
        var branch = this.zvs.change(
            "definitions", [
                this.zvs.add(prepare.definitions(this.definitions)), 
                this.globalsHash
            ]
        );
        
        result = {
            definitions: branch
        };

        result.queries = {};

        for (var i=0; i<defs.queries.length; i++) {
            var q = this.zvs.add(
                prepare.query(defs.queries[i])
            );

            var r = this.zvs.change(
                "query", 
                [
                    q,
                    this.globalsHash
                ],
                branch
            );
            
            if (r && r.length > 0) {
                result.queries[q] = r;
            }
        }
    }
    
    return result;
};

Run.prototype.query = function (defs) {
    var r = this.add(defs);
    var b, o, globals;
    
    var objs = [];
    
    if (r.queries) {
        for (var query in r.queries) {
            var branches = r.queries[query];
            for (var i=0; i< branches.length; i++) {
                b = branches[i];
                globals = this.zvs.getData(b, this.globalsHash);

                o = this.zvs.getObject(
                    globals.query,
                    b
                );
                
                objs.push(o);
            }
        }
    }
    
    return objs;
};

Run.prototype.print = function (defs) {
    return this.query(defs).map(function (o) {
        return utils.toString(o, true);
    }).join('\n');
};

module.exports = Run;