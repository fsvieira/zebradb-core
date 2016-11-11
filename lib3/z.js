// TODO: make a new parser with pegjs
var zparser = require("../lib/zparser");
var ZVS = require("./zvs");
var Unify = require("./unify");
var utils = require("./utils");


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

/*
    Query, maybe put this in seperated file
*/
function check (q, defs, b) {
    var r = [];

    for (var i=0; i<defs.length; i++) {
        var branch = b.change("unify", [q, defs[i]]);

        if (branch) {
            // convervative check,
            // this.zvs.update(b, q, {check: true});
            r = r.concat(branch);
        }
    }
    
    return r;
}


function query (q, globalsHash) {
    var r = [];

    var globals = this.get(globalsHash);
    var defs = this.get(globals.definitions);
    
    this.update(globalsHash, {query: this.getObject(q)});

    // choose tuples to evaluate,
    var tuples = planner(q, this);
    
    for (var i=0; i<tuples.length; i++) {
        // check will lock this branch changes, so
        // optimistic check,
        this.update(tuples[i], {check: true});
    }

    for (var i=0; i<tuples.length; i++) {
        var branchs = check(tuples[i], defs, this);
        
        if (branchs.length === 0) {
            // fail
            return [];
        }
        else {
            r.push(branchs);
        }
    }
    
    // TODO: intersect branchs, return new branchs.
    // multiply branchs,
    while (r.length > 1) {
        var a = r.pop();
        var b = r.pop();

        var nr = [];
        
        for (var i=0; i<a.length; i++) {
            var bA = a[i];
            for (var j=0; j<b.length; j++) {
                var bB = b[j];
                
                // bA * bB
                var bs = this.zvs.merge([bA, bB], "unify");
                
                if (bs) {
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

    return r;
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

/*
    Query, END
*/

/*
function copy (def, prefix) {
    var variables = {};
    def = Object.assign({}, def);
    var id = 0;
    
    function rename (v) {
        if (v.type === 'tuple') {
            for(var i=0; i<v.data.length; i++) {
                rename(v.data[i]);
            }
        }
        else if (v.type === 'not') {
            rename(v.data, variables);
        }
        else if (v.type === 'variable') {
            if (v.data === undefined || v.data === '') {
                // anonimous variable, set name,
                v.data = prefix + ":" + id++;
            }
            else {
                var vname = variables[v.data] || prefix + ":" + id++;
                variables[v.data] = vname;

                // rename variable,
                v.data = vname;
            }
        }
    }
    
    rename(def);
    
    return def;
}
*/

// zvs functions end.

function Run () {
    this.definitions = [];
    this.definitionsCodes = [];
    
    this.zvs = new ZVS()
        .action("definitions", definitions)
        .action("query", query);

    this.unify = new Unify(this.zvs);

    // this.add(defs);
    
    // var self = this;
    
    // Store global data on zvs,
    this.globalsHash = this.zvs.add({type: "globals"});
}


Run.prototype.parse = function (defs) {
    if (defs) {
        if (typeof defs === 'string') {
    		defs = zparser.parse(defs);
    	}
    	else {
    	    // Clone definitions, 
    	    defs = Object.assign({}, defs);
    	}
    }

    return defs;  
};

// TODO: return a promisse!!
Run.prototype.add = function (defs) {
    defs = this.parse(defs);

    this.definitions = this.definitions.concat(defs.definitions || defs);

    /*
    var self = this;

    var codes = (defs.definitions || defs).map(function (o) {
        return self.zvs.add(o);
    });

    this.definitionsCodes = this.definitionsCodes || [];

    for (var i=0; i<codes.length; i++) {
        var code = codes[i];
        
        if (this.definitionsCodes.indexOf(code) === -1) {
            this.definitionsCodes.push(code);
        }
    }*/
    
    var branch = this.zvs.change(
        "definitions", [
            this.zvs.add(this.definitions), 
            this.globalsHash
        ]
    );
    
    var result;
    
    if (defs.queries) {
        result = {};

        for (var i=0; i<defs.queries.length; i++) {
            var q = this.zvs.add(defs.queries[i].tuple);
            result[q] = this.zvs.change(
                "query", 
                [
                    q,
                    this.globalsHash
                ],
                branch
            );
        }
    }
    
    return result;
};

/*
Run.prototype.query = function (q) {
    this.zvs.change("query", [q, this.definitionsCodes]);
};*/

// --- TESTS -----
var run = new Run();

var r = run.add("(yellow (blue green)) (blue green) ?(yellow (blue green))");

// console.log(JSON.stringify(r));


console.log("Dump");
var b, o, globals;
for (var i=0; i<run.zvs.objects.active.length; i++) {
    b = run.zvs.objects.active[i];
    globals = run.zvs.getData(b, run.globalsHash);
    o = run.zvs.getObject(globals.query, b);
    console.log(
        utils.toString(o, true)
    );
}

/*
console.log(run.globalsHash  + " === " + run.zvs.add({type: "globals"}));
console.log(JSON.stringify(run.zvs.getObject(run.globalsHash)));
console.log(JSON.stringify(run.zvs.getObject(run.globalsHash, run.zvs.objects.active[0])));
console.log(JSON.stringify(run.zvs.objects, null, '\t'));
*/

console.log(JSON.stringify(run.zvs.objects, null, '\t'));

/*
for (var q in r) {
    var branchs = r[q];

    if (branchs.length === 0) {
        console.log(
            utils.toString(run.zvs.getObject(q), true) + " => FAIL!"
        );
    }
    else {
        for (var i=0; i<branchs.length; i++) {
            var branch = branchs[i];
            console.log(
                utils.toString(run.zvs.getObject(q), true) + " => " +
                utils.toString(run.zvs.getObject(q, branch), true)
            );
        }
    }
}*/
