var Parser = require("./zparser");
var Parallel = require('paralleljs');

function Z (definitions) {
    this.definitions = [];
    this.queries = [];
    var result;
    
    if (typeof definitions === 'string') {
        result = Parser.parse(definitions);
    }
    else {
        result = definitions;           
    }

    this.definitions = this.definitions.concat(result.definitions);
    this.queries = this.queries.concat(result.queries);
}


var z = new Z("(number 0) (number 1) (number 2) (number 3)");

function toString (v) {
    if (v === null) {
        return "null"; // just for debug purposes.
    }
    
    switch (v.type) {
        case "variable":
            var name = "'" + (v.name?v.name:"");
            var values = "";
            if (v.equals && v.equals.length) {
                for (var i = 0; i<v.equals.length; i++) {
                    values += " " + toString(v.equals[i]);
                }
                
                values = " = [" + values + " ]";
            }
            return name + values;
            
        case "constant":
            return v.value;
            
        case "tuple":
            var s = "";
            for (var i=0; i<v.tuple.length; i++) {
                s += " " + toString(v.tuple[i]);
            }
            
            return "(" + s +" )";
            
        default:
            return "Unkonw type : " + JSON.stringify(v);
    }
}

function getVarname (name, prefix, variables) {
    var idx = -1;
    if (name && name !== '') {
        idx = variables.indexOf(p.name);
    }
        
    if (idx === -1) {
        idx = variables.length;
        variables.push(p.name);
    }
    
    return (prefix || '') + "$" + idx;
}


function partition (p) {
    var result = [];
    partition_aux(p, "", [], result);
    return result;
}

function partition_aux (p, prefix, variables, result) {
    result = result || [];
    variables = variables || [];
    if (p.type === "tuple") {
        var v = {
            type: "variable",
            name: getVarname(
                undefined,
                prefix,
                variables
            ),
            equals: [p]
        }; 
        
        for (var i=0; i<p.tuple.length;i++) {
            var pv = partition_aux(p.tuple[i], v.name, variables, result);
            if (pv.type === 'variable') {
                result.push(pv);
                p.tuple[i] = {
                    type: "variable",
                    name: pv.name
                };
            }
        }
        
        result.push(v);
        return v;
    }
    else if (p.type === "constant") {
        return p;
    }
    else if (p.type === "variable") {
        p.name = getVarname(p.name, prefix, variables);
        return p;
    }
    
    throw new Error ("Wrong type: " + p.type + ", " + JSON.stringify(p));
}

Z.prototype.query = function (p) {
    if (typeof p === 'string') {
        p = Parser.parse(p).definitions[0];
    }
    
    var data = [];
    this.definitions.forEach (function (q) {
        data.push({p: p, q: q});
    });
    
    var parallel = new Parallel(data);

    return parallel.map(function (pq) {
        var ZQuery = require("/home/ubuntu/workspace/lib/zquery.js");
        var p = pq.p;
        var q = pq.q;

        var zp = ZQuery.create(p);
        var zq = ZQuery.create(q);

        p.transitions = {};        
        if (zp.unify(zq)) {
            // setup p transtions,
            var variables = [];
            for (var i=0; i < zp.tuple.length; i++) {
                var v = zp.tuple[i];
                if (v instanceof ZQuery.Variable) {
                    var index = -1;
                    if (v.name && v.name !== '') {
                        index = variables.indexOf(v.name);
                    }
                    
                    if (index === -1) {
                        variables.push(v);
                        index = variables.length-1;
                    }
                    
                    var vname = v.name + "$" + index;
                    p.transitions[vname] = [v.getValue()]; // convert value to json v.getValueJSON().
                }
            }
        }

        return p;
        
    }).reduce(function (d) {
        var p = d[0];
        var q = d[1];


        for (var v in q.transitions) {
            p.transitions[v] = (p.transitions[v] || []).concat(q.transitions[v]);
        }

        return p;
    });
};

/*
z.query("(number 'x)")
    // .map(toString)
    .then(function (data) {
        console.log(data);
    });
*/


/*z.query(toString, concatString).then(function log() {
    console.log(arguments); 
});*/


/*
var p = new Parallel([1, 2, 3], {
  env: {
    a: 10
  }
});
 
// returns 10, 20, 30
p.map(function (d) {
  return d * global.env.a;
});
 
// Configure the namespace
p = new Parallel([1, 2, 3], {
  env: {
    a: 10
  },
  envNamespace: 'parallel'
});
 
p.map(function (d) {
  return d * global.parallel.a;
});
*/

var p = Parser.parse("(nat (nat 0))").definitions[0];
console.log(JSON.stringify(p));
var result = partition(p);

console.log(JSON.stringify(result, null, '\t'));

for (var i=0; i<result.length; i++) {
   console.log(toString(result[i]));
}