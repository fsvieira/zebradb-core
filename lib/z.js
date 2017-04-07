var zparser = require("./zparser");
var ZVS = require("./zvs");
var unify = require("./unify");
var utils = require("./utils");
var prepare = require("./prepare");
var negation = require("./negation");
var graph = require("./graph");
var negation = require("./negation");

function _planner (q, b, tuples) {
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
                _planner(data[i], b, tuples);
            }
        }
    }

    return tuples;
}

function planner (q, b) {
    var tuples = _planner(q, b);
    
    var noLoops = tuples.filter(function (t) {
        return !b.get(b.get(t).loop);
    });
    
    if (noLoops.length > 0) {
        return noLoops;
    }
    
    return tuples;
    
}

function negations (ns) {
    var query = this.global("query");
    var queryObj = this.get(query);
    var negations = prepare.union(this, this.get(ns) || [], this.get(queryObj.negation) || []);

    this.update(query, {negation: negations});
    return negation(this);
}

/*
function setNegations (b, c) {
    if (c.negation && c.negation.length > 0) {
        var n = b.add(c.negation);
        return b.change("negations", [n]);
    }
}*/

function check (q, defs, b) {
    var r = [];

    for (var i=0; i<defs.length; i++) {
        var c = prepare.copyWithVars(defs[i], b);
        var negation = c.negation;
        
        delete c.negation;
        var def = b.add(c);
        
        var branch = b.change("unify", [q, def]);

        if (branch && negation && negation.length > 0) {
            var n = b.add(negation);
            branch = b.change("negations", [n], branch);
        }

        if (branch) {
            r = r.concat(branch);
        }
    }
    
    return r;
}


function query (q) {
    var r = [];
    var bs, branches;

    if (q) {
        this.transform(this.zvs.global("query"), q);
    }
    else {
        q = this.zvs.global("query");
    }

    var settings = this.getObject(this.zvs.global("settings"));
    var defs = this.getObject(this.zvs.global("definitions")).definitions;

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
                this.notes({status: {fail: true, reason: "check fail!"}});
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
                    bs = this.zvs.merge([bA, bB], "mergeConflictHandler");
                    
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
                this.notes({status: {fail: true, reason: "merge fail!"}});
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
                "query", [],
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
    else {
        this.notes({status: {fail: true, reason: "no results!"}});
    }

    return branches;
}

function definitions (defsHash) {
    var defs = this.getObject(defsHash);

    var definitionsList = [];

    for (var i=0; i<defs.length; i++) {
        var d = defs[i];
        if (definitionsList.indexOf(d) === -1) {
            definitionsList.push(d);
        }
    }

    this.update(this.global("definitions"), {definitions: definitionsList});
    
    return true;
}

function Run (deep) {
    this.definitions = [];
    this.definitionsCodes = [];
    
    this.zvs = new ZVS()
        .action("definitions", definitions)
        .action("query", query)
        .action("negations", negations)
        .action("unify", function (p, q) {
            return unify(p, q, this, true);
        })
        .action("mergeConflictHandler", function (p, q) {
            return unify(p, q, this, false);
        });

    // Setup globals,
    this.zvs.transform(
        this.zvs.objects.root,
        this.zvs.global("settings"),
        this.zvs.add({type: 'settings', deep: deep})
    );
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
        var preDefs = prepare.definitions(this.definitions);
        
        graph(preDefs);
        
        var branch = this.zvs.change(
            "definitions", [
                this.zvs.add(preDefs)
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
                [q],
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
    var b, o;
    
    var objs = [];
    
    if (r.queries) {
        var queryHash = this.zvs.global("query");
        
        for (var query in r.queries) {
            var branches = r.queries[query];
            for (var i=0; i< branches.length; i++) {
                b = branches[i];

                o = this.zvs.getObject(
                    queryHash,
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