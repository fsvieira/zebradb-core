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

/*Z.prototype.query = function (map, reduce) {
    var p = new Parallel(this.definitions);
    return p.map(map).reduce(reduce);
};*/



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

function concatString (vs) {
    return vs[0] + " " + vs[1];
}

function unify (p, q, ctx) {
    if (p.type === q.type) {
        if (p.type === 'tuple') {
            // handle tuple case,
            if (p.tuple.length === q.tuple.length) {
                for (var i=0; i<p.tuple.length; i++) {
                    if (!unify(p.tuple[i], q.tuple[i])) {
                        return false; // unble to unify at least on element
                    }
                }
                
                return true; // all elements have been successfully unified.
            }
            else {
                return false;
            }
        }
        else if (p.type === 'constant') {
            if (p.value === q.value) {
                return p;
            }
            
            return false;
        }
    }
    else if (q.type === 'variable') {
        return unify(q, p);
    }
    // handle variable case,

    if (p.type === 'variable') {
        p.equals = p.equals || [];
        
        if (p.equals.indexOf(q) === -1) {
            if (p.equals.length === 0) {
                p.equals.push(q);
            }
            
            if (q.type === 'variable') {
                return unify(p, q);
            }
        }
        
        return true;
    }
    

    return false;
    
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
    parallel.require("zquery.js");

    return parallel.map(function (pq) {
        var p = pq.p;
        var q = pq.q;
        /*var v;
        if (unify(p, q)) {
            p.transitions = {};
            
            for (var i=0;i< p.tuple.length; i++) {
                v = p.tuple[i];
                if (v.type === 'variable') {
                    var vname = v.name + "$" + i;
                    p.transitions[vname] = (p.transitions[vname] || []).concat(v.equals);
                }
            }
            
        }
        else {
            p.transitions = {};    
        }
        
        for (var i=0;i< p.tuple.length; i++) {
            v = p.tuple[i];
            if (v.type === 'variable') {
                v.equals = [];
            }
        }*/
        
        p = zquery.create(p);
        
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

z.query("(number 'x)")
    // .map(toString)
    .then(function (data) {
        console.log(data);
    });


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