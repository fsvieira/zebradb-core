
function constantToString (c) {
    return c.value;
}

function notEqualsToString (a) {
    if (a && a.length > 0) {
        var r = [];
        for (var i=0; i<a.length; i++) {
            r.push(toString(a[i]));
        }
        
        return ":[^" + r.join(" ") + "]";
    }
    
    return "";
}

function variableToString (v) {
    return  "'" + (v.name || "") + notEqualsToString(v.notEquals);
}

function tupleToString (t) {
    var s = "";
    for (var i=0; i<t.tuple.length; i++) {
        s += toString(t.tuple[i]) + " ";
    }
    
    s = s.substring(0, s.length-1);
    return "(" + s + ")";
}

// 
function tableFieldsToString (v) {
    if (!(v.query || v.result || v.vars)) {
        return v;
    }

    var table = {};
    if (v.query) {
        table.query = "?" + tupleToString(v.query);
    }

    if (v.result) {
        table.result = JSON.parse(JSON.stringify(v.result));

        // convert all vars,
        if (table.result) {
            for (var i=0; i<table.result.length; i++) {
                var t = table.result[i];
                if (t.bound) {
                    t.bound.sort();
                }
                
                for (var j in t.vars) {
                    t.vars[j] = toString(t.vars[j]);
                }    
            }
        }
    }
    
    if (v.vars) {
        table.vars = JSON.parse(JSON.stringify(v.vars));
        table.bound = (v.bound || []).slice(0).sort();
        
        for (var j in table.vars) {
            table.vars[j] = toString(table.vars[j]);
        }
    }
    
    
    return table;
}


function toString (v) {
    if (typeof(v) === 'string') {
        return v;
    }
    
    if (v) {
        switch (v.type) {
            case "value": return toString(v.value);
            case "defered": return toString(v.defered);
            case "variable": return variableToString (v);
            case "constant": return constantToString (v);
            case "tuple": return tupleToString (v);
            default:
                if (v.map) {
                    // return JSON.stringify(v.map(toString), null, '\t');
                    return v.map(toString);

                }
                else {
                    // return JSON.stringify(tableFieldsToString(v), null, '\t');
                    return tableFieldsToString(v);
                }
        }
    }

    return "";
}


module.exports = {
    toString: function (v) {
        var r = toString(v);
        if (typeof(r) !== 'string') {
            r = JSON.stringify(r, null, '\t');
        }
        
        return r;
    },
    tableFieldsToString: tableFieldsToString
};
