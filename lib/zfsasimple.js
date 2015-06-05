var ZQuery = require("./zquery");

function find (arr, elem) {
    for (var i=0; i<arr.length; i++) {
        var r = arr[i];
        
        if ((r.value === elem.value) && (r.to === elem.to)) {
            return true;
        }
    }
    
    return false;
}

function solve (fsa, q, from) {
    
    var qLoad = q.save();
    for (var i=0; i<fsa.states.length; i++) {
        var p = fsa.states[i];
        var pLoad = p.save();
        from = (from === undefined)?i:from;
        
        if (q.unify(p)) {
            var t = fsa.delta[from];
            t.variables.forEach(function(v, vIndex) {
                var value = v.getValue();
                if (value) {
                    var elem = {value: value, to: i};
                    var arr = t.transitions[vIndex];
                    if (!find(arr, elem)) {
                        arr.push(elem);
                    }
                }
            });
            
            for (var j=0; j<q.tuple.length; j++) {
                var v = q.tuple[j];
                if (v instanceof ZQuery.Tuple) { 
                    solve(fsa, v, from);
                }
            }
        }
        
        pLoad();
        qLoad();
    }
    
}

ZQuery.Run.prototype.fsaSimple = function () {
    
    var definitions = this.definitions;
    
    var fsa = {
        states: [],
        delta: {}
    };
    
    var state;

    for (var i=0; i<definitions.length; i++) {
        state = ZQuery.create(definitions[i]);
        fsa.states.push(state);
        var t = {
            variables: state.getVariables(),
            transitions: []
        };

        fsa.delta[fsa.states.length-1] = t;
        
        for (var j=0; j<t.variables.length; j++) {
            t.transitions[j] = [];
        }
    }

    for (var i=0; i<fsa.states.length; i++) {
        state = fsa.states[i];
        solve(fsa, state, i);
    }

    return fsa;
}


// var run = new ZQuery.Run("(nat 0) (nat (nat 'x))");
// var run = new ZQuery.Run("(nat 0) (nat 'x)");

// console.log(outDOT(planner("(nat 0) ?(nat ^0)")));


/*
console.log(outDOT(planner( // Nat
    "(nat 0)" +
                "(nat (nat 'n))" +

                // Add
                // a . 0 = a,
                "(+ (nat 'a) (nat 0) (nat 'a) ')" +

                // a . S(b) = a + (a . b)
                "(+ (nat 'a) (nat (nat 'b)) (nat 'r) (+ (nat 'a) (nat 'b) 'r '))" +

                // List
                "(list)" +
                "(list 'item (list ' '))" +
                "(list 'item (list))" +

                // Mul                    
                // a . 0 = 0
                "(* (nat 'a) (nat 0) (nat 0) ')" +

                // a . S(b) = a + (a . b)
                "(* (nat 'a) (nat (nat 'b)) 'r (list (+ (nat 'a) 'rm 'r ') (list (* (nat 'a) (nat 'b) 'rm ') (list))))" +

                // 0! = 1
                "(fac (nat 0) (nat (nat 0)) ')" +
                "(fac (nat (nat 'k)) 'n (list (* 'n1 (nat (nat 'k)) 'n ') (list (fac (nat 'k) 'n1 ') (list))))"
                // + "?(fac (nat 0) 'n ')"
)));
*/

// console.log(outDOT(planner("[../examples/z/brave_2]")));

var outDOT = require("./zoutfsa").dot;

var run = new ZQuery.Run("(nat 0) (nat (nat 'x))");

console.log(outDOT(run.fsaSimple()));


