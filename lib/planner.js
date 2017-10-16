const utils = require("./utils");

function getTuples (zvs, branchId, q, tuples) {
    // normalize id,
    q = zvs.branches.getDataId(branchId, q);
    
    tuples = tuples || [];

    if (tuples.indexOf(q) === -1) {
        var d = zvs.getData(branchId, q);
    
        if (zvs.getData(branchId, d.type) === 'tuple') {
            if (!d.check || !zvs.getData(branchId, d.check)) {
                tuples.push(q);
            }
            
            var data = zvs.getData(branchId, d.data);
            for (var i=0; i<data.length; i++) {
                getTuples(zvs, branchId, data[i], tuples);
            }
        }
    }

    return tuples;
}


/*
    Grow planners
*/
/*
    Sort tuples by definitions count,
    calculate possible grow.
*/
function planner_1 (zvs, branchId, q) {
    // console.log(utils.toString(zvs.getObject(branchId, q), true));

    const tuples = getTuples(zvs, branchId, q);

    if (tuples.length === 0) {
        return [];
    }
    
    // get defintions branch id,
    const ddata = zvs.getData(branchId, zvs.data.global("definitions")).data;
    const definitionsBranchId = zvs.getData(branchId, zvs.getData(branchId, ddata).branchId);
    
    const match = zvs.definitionsMatch[definitionsBranchId];
    
    // const matchTuples = match.match(branchId, q);
    const matchTuples = [];
    for (var i=0; i<tuples.length; i++) {
        const tuple = tuples[i];
        const definitions = match.match(branchId, tuple);
        
        if (definitions && definitions.length) {
            matchTuples.push({
                tuple,
                definitions
            });
        }
        else {
            // no match for this tuples,
            return;
        }
    }

    return matchTuples;

    /*
    const lsort = {};

    for (var i=0; i<matchTuples.length; i++) {
        const {tuple, definitions} = matchTuples[i];

        if (definitions && definitions.length > 0) {
            const r = lsort[definitions.length] = lsort[definitions.length] || [];

            r.push({
                tuple,
                definitions
            });
        }
        else {
            // console.log("FAIL!! " + tuple + " => " + utils.toString(zvs.getObject(branchId, tuple), true));
            return;
        }
    }
    
    
    
    
    var min = Infinity;
    var r;

    for (var l in lsort) {
        const v = Math.pow(+l, lsort[l].length);
        if (min > v) {
            min = v;
            r = lsort[l];
        }
    }
    
    
    // console.log("P => " + r.map(t => utils.toString(zvs.getObject(branchId, t.tuple), true)).join("; "));
    
    return r*/;
}

module.exports = planner_1;
