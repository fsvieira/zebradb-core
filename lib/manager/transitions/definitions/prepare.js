"use strict";

function clone (obj) {
    if (obj === null || obj === undefined || typeof obj !== "object") {
        return obj;
    }

    let temp = obj.constructor(); // give temp the original obj's constructor
    for (let key in obj) {
    	if (obj.hasOwnProperty(key)) {
	        temp[key] = clone(obj[key]);
    	}
    }

    return temp;
}

function copyWithVars (p, genId) {
    p = clone(p);
    let q = [p];
    const vars = {};
    let nots = [];

    while (q.length > 0) {
        const v = q.pop();

        if (v.type === "variable") {
            if(v.data && v.data.trim().length > 0) {
                v.id = vars[v.data] || genId();
                vars[v.data] = v.id;
            }
            else {
                v.id = genId();
            }
        }
        else if (v.type === "tuple") {
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
    let defs = [];
    let counter = 0;
    let genId = function () {
        return prefix + counter++;
    };

    for (let i=0; i<tuples.length; i++) {
        const tuple = tuples[i];
        defs.push(copyWithVars(tuple, genId));
    }

    return defs.map(def => {
        def.check = check;
        return def;
    });
}

function uniqFast(a) {
    let seen = {};
    let out = [];
    let len = a.length;
    let j = 0;

    for(let i = 0; i < len; i++) {
        let item = a[i];

        if(seen[item] !== 1) {
            seen[item] = 1;
            out[j++] = item;
        }
    }

    return out.sort();
}

function union (zvs, branchId, idsA, idsB) {
    let r = uniqFast((idsA || []).concat(idsB || []));

    r = r.map(o => {
        return zvs.getObject(branchId, o);
    });

    return r;
}

module.exports = {
    clone,
    query,
    definitions,
    copyWithVars,
    union,
    uniqFast
};
