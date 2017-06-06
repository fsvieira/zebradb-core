const prepare = require("./prepare");
const definitions = require("./actions/definitions");
const flyd = require("flyd");

function getTuples (zvs, branchId, q, ignoreChecked) {
    var tuples = [q];
    var code;
    var all = [q]; 
    
    while (tuples.length > 0) {
        code = zvs.branches.getDataId(branchId, tuples.pop());
        var v = zvs.getData(branchId, code);
        var type = zvs.getData(branchId, v.type);
            
        if (type === 'tuple') {
            var data = zvs.getData(branchId, v.data);
            tuples = tuples.concat(data);
            
            if (!ignoreChecked || !zvs.getData(branchId, v.check)) {
                all.push(code);
            }
        }
    }
    
    return all;
}


function negation (zvs, branchId, ignoreChecked) {
    const query = require("./actions/query");

    var definitionsHash = zvs.getData(branchId, zvs.data.global("definitions")).definitions;
    var q = zvs.data.global("query");
    
    var nots = zvs.getData(branchId, zvs.getData(branchId, q).negation);
    
    if (nots && nots.length > 0) {
        var variables = [];
    
        getTuples(zvs, branchId, q, ignoreChecked).forEach(function (t) {
            var tuple = zvs.getData(branchId, t);
            var data = zvs.getData(branchId, tuple.data);
            
            for (var i=0; i<data.length; i++) {
                const code = zvs.branches.getDataId(branchId, data[i]);
                
                const v = zvs.getData(branchId, code);
                const type = zvs.getData(branchId, v.type);
                
                if (type === 'variable') {
                    variables.push(code);
                }
            }
        });
        
        var tuples;
        var code;
        var v;
        var type;
        var data;
        
        // find nots that can be executed,
        for (var i=nots.length-1; i >= 0; i--) {
            tuples = [nots[i]];
            var execute = true;
            
            while (tuples.length > 0) {
                code = zvs.branches.getDataId(branchId, tuples.pop());
                v = zvs.getData(branchId, code);
                
                if (v.exists !== undefined) {
                    execute = false;
                    break;
                }
                
                type = zvs.getData(branchId, v.type);
                
                if (type === 'variable') {
                    
                    if (variables.indexOf(code) !== -1) {
                        execute = false;
                        break;
                    }
                }
                else if (type === 'tuple') {
                    data = zvs.getData(branchId, v.data);
                    tuples = tuples.concat(data);
                }
            }
            
            if (execute) {
                var neg = zvs.getObject(branchId, nots[i]);
                
                var nQuery = zvs.data.add(
                    prepare.query(neg)
                );
                
                const definitionsBranchId = definitions(zvs, {branchId: zvs.branches.root, args: [definitionsHash]});
                
                const success$ = flyd.stream();
                flyd.on(function ({branchId, end}) {
                    if (end) {
                        zvs.branches.notes(branchId, {status: {fail: true, reason: "negation fail!"}});
                    }
                    else {
                        zvs.update(branchId, nots[i], {exists: false});
                    }
                    
                    success$.end(true);
                }, success$);
                
                query(zvs, success$, {branchId: definitionsBranchId, args: [nQuery]});
                
                /*
                var results = query(zvs, undefined, {branchId: definitionsBranchId, args: [nQuery]});
    
                if (results && results.length > 0) {
                    zvs.branches.notes(branchId, {status: {fail: true, reason: "negation fail!"}});
                    return false;                
                }
                else {
                    zvs.update(branchId, nots[i], {exists: false});
                }*/
            }
        }
    }
    
    return true;
}

module.exports = negation;

