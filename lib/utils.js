
function constantToString (c) {
    return c.value;
}

function variableToString (v) {
    return  "'" + (v.name || "");
}

function tupleToString (t) {
    var s = "";
    for (var i=0; i<t.tuple.length; i++) {
        s += toString(t.tuple[i]) + " ";
    }
    
    s = s.substring(0, s.length-1);
    return "(" + s + ")";
}

/*
function tableGetLeafs (table, results) {
    results = results || [];

    table.bound.sort();
    
    if (!table.childs || (table.childs.length === 0)) {
        results.push(table);
    }
    else {
        for (var i=0; i<table.childs.length; i++) {
            tableGetLeafs(table.childs[i], results);
        }
    }
    
    return results;
}*/

// 
function tableFieldsToString (v) {
    var table = {};
    if (v.query) {
        table.query = "?" + tupleToString(v.query);
    }

    if (v.result) {
        /*var results = [];
        for (var i=0; i<v.result.length; i++) {
            tableGetLeafs(v.result[i], results);
        }
        */
        
        table.result = JSON.parse(JSON.stringify(v.result));

        // convert all vars,
        if (table.result) {
            for (var i=0; i<table.result.length; i++) {
                var t = table.result[i];
                for (var j in t.vars) {
                    if (t.bound) {
                        t.bound.sort();
                    }
                    t.vars[j] = toString(t.vars[j]);
                }    
            }
        }
    }    

    return table;
}


function toString (v) {
    if (v) {
        switch (v.type) {
            case "value": return toString(v.value);
            case "defered": return toString(v.defered);
            case "variable": return variableToString (v);
            case "constant": return constantToString (v);
            case "tuple": return tupleToString (v);
            default:
                return JSON.stringify(tableFieldsToString(v));
        }
    }
    return "";
}


module.exports = {
    toString: toString,
    tableFieldsToString: tableFieldsToString
};
