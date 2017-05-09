var utils = require("./utils");

function clone (obj) {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
        return obj;
    }
 
    var temp = obj.constructor(); // give temp the original obj's constructor
    for (var key in obj) {
        temp[key] = clone(obj[key]);
    }
 
    return temp;
}

function copyWithVars (p, genId) {
    p = clone(p);
    var q = [p];
    var vars = {};
    var nots = [];

    while (q.length > 0) {
        var v = q.pop();
        
        if (v.type === 'variable') {
            if(v.data && v.data.trim().length > 0) {
                v.id = vars[v.data] || genId.uniqueId();
                vars[v.data] = v.id;
            }
            else {
                v.id = genId.uniqueId();
            }
        }
        else if (v.type === 'tuple') {
            q = q.concat(v.data);
            if (v.negation) {
                nots = nots.concat(v.negation);
                q = q.concat(v.negation);
                delete v.negation;
            }
        }
    }

    p.negation = nots;
    
    return p;
}

function query (query) {
    return prepare([query], "query$", false)[0];
}

function definitions (defs) {
    return prepare(defs, "definition$", true);
}

function prepare (tuples, prefix, check) {
    var defs = [];
    var counter = 0;
    var genId = {
        uniqueId: function () {
            return prefix + counter++;
        }
    };
    
    for (var i=0; i<tuples.length; i++) {
        var tuple = tuples[i];
        defs.push(copyWithVars(tuple, genId));
    }

    return defs.map(function (def) {
        def.check = check;
        return def;
    });
}

function uniq_fast(a) {
    var seen = {};
    var out = [];
    var len = a.length;
    var j = 0;
    for(var i = 0; i < len; i++) {
        var item = a[i];
        if(seen[item] !== 1) {
            seen[item] = 1;
            out[j++] = item;
        }
    }
    
    return out.sort();
}

function union (branch, idsA, idsB) {
    var r = uniq_fast((idsA || []).concat(idsB || []));

    r = r.map(function (o) {
        return branch.zvs.getObject(branch.id, o);
    });
    
    return r;
}

module.exports = {
    clone: clone,
    query: query,
    definitions: definitions,
    copyWithVars: copyWithVars,
    union: union,
    uniq_fast: uniq_fast
};
