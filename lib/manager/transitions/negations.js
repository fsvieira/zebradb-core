const prepare = require("./definitions/prepare");
const utils = require("../../utils");
/*
function getTuples(zvs, branchId, q, ignoreChecked) {
    var tuples = [q];
    var code;
    // var all = [q];
    var all = [];
    
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
*/

function hasVariables (zvs, branchId, tupleId) {
    const tuples = [tupleId];
    var all = [];
    
    while (tuples.length > 0) {
        const tupleId = tuples.pop();
        
        const tuple = zvs.getData(branchId, tupleId);
        const data = zvs.getData(branchId, tuple.data);
        
        for (let i=0; i<data.length; i++) {
            const id = data[i];
            const v = zvs.getData(branchId, id);
            const type = zvs.getData(branchId, v.type);
            
            if (type === 'variable') {
                return true;
            }
            else if (type === 'tuple' && all.indexOf(id) === -1) {
                tuples.push(id);
                all.push(id);
            }
        }
    }
    
    return false;
}

var counter = 0;
function runQuery (zvs, events, branchId, tupleId, abort) {
    const neg = zvs.getObject(branchId, tupleId);
    
    // console.log("+++ [" + (++counter) + "]: " + utils.toString(zvs.getObject(branchId, tupleId), true));

    var nQueryId = zvs.data.add(
        prepare.query(neg)
    );
    
    const definitionsBranchId = zvs.getData(branchId, zvs.getData(branchId, zvs.getData(branchId, zvs.data.global("definitions")).data).branchId);
    const {branchId: queryBranchId, exists} = zvs.branches.getId({
        parent: definitionsBranchId,
        args: [nQueryId],
        action: 'query'
    });
    
    if (!exists) {

        zvs.branches.transform(
            queryBranchId,
            zvs.data.global("queryBranchId"),
            zvs.data.add({
                type: 'query',
                data: queryBranchId
            })
        );
        
        zvs.branches.transform(queryBranchId, zvs.data.global("query"), nQueryId);
    }
    
    return new Promise(function (resolve, reject) {
        let fail = false;
        
        const stop = function () {
            // events.off("track", track);
            // events.off("success", success);
        };
        
        abort.push(stop);
        
        function track({
            id,
            actives
        }) {
            if (actives === 0 && queryBranchId === id) {
                stop();
                
                if (!fail) {
                    // console.log("--- SUCC [" + (--counter) + "] =>  " + utils.toString(zvs.getObject(branchId, tupleId), true));
                    zvs.update(branchId, tupleId, {exists: false});
                    resolve();
                }
            }
        }

        // TODO: make all events send, if exists, track id to events.
        function success(successBranchId) {
            const id = zvs.getObject(successBranchId, zvs.data.global("queryBranchId")).data;
    
            if (!fail && queryBranchId === id) {
                // A negation query has succeded, the branch fails,
                // TODO:
                //   * fail branches,
                
                stop();
                fail = true;
                // console.log("--- FAIL [" + (--counter) + "]=>  " + utils.toString(zvs.getObject(branchId, tupleId), true));
                zvs.update(branchId, tupleId, {exists: true});
                reject();
            }
        }
    
        events.on("track", track);
        events.on("success", success);
        
        events.trigger('add-checkDepth', {value: queryBranchId, trackId: queryBranchId});
    });
}

function negations (req, res) {
    const {zvs, events} = req.context;
    const {branches, negations: negs, branchId} = req.args;

    if (negs.length === 0) {
        if (branchId) {
            res.send({value: {branchId}});
        }
        else {
            res.send({value: {branches}});
        }
        return;
    }
    
    const execute = branchId !== undefined;

    const evalAllNegations = [];
    let globalAbort = [];
    
    for (let i=0; i<negs.length; i++) {
        const {branchId, negations: nots, branches} = negs[i];
        const evalBranchNegations = [];
        const abort = [];
        globalAbort = globalAbort.concat(abort);

        for (let j=0; j<nots.length; j++) {
            const tupleId = nots[j];

            if (execute || !hasVariables(zvs, branchId, tupleId)) {
                // execute tupleId,
                evalBranchNegations.push(runQuery(zvs, events, branchId, tupleId, abort));
            }
        }
        
        evalAllNegations.push(
            Promise.all(evalBranchNegations).then(() => {
                // Everything is ok,
                return true;
            }, () => {
                // at least one of negations has failed, we need to remove branch,
                const index = branches.indexOf(branchId);
                abort.forEach(f => f());
                branches.splice(index, 1);
                
                if (branches.length === 0) {
                    return Promise.reject();
                }
                
                return Promise.resolve();
            })
        );
    }
    
    Promise.all(evalAllNegations).then(() => {
        if (branchId) {
            res.send({value: {branchId}});
        }
        else {
            res.send({value: {branches}});
        }        
    }, () => {
        globalAbort.forEach(f => f());
        res.send({});
    });
    

    /*
    const queryId = zvs.data.global("query");

    const variables = [];
    var ntuples;
    var code;
    var v;
    var type;
    var data;
    var fail = false;
    var queriesIds = [];
    var checked = [];
    
    // TODO: we need a better way to check if negation can be evaluated,
    for (let i=0; i<branches.length; i++) {
        const branchId = branches[i];
        const uncheckedTuples = getTuples(zvs, branchId, queryId, true);
                
        if (uncheckedTuples.length) {
            // Don't ignore checked, we can't garantee that a variable will 
            // not change on a checked tuple.
            getTuples(zvs, branchId, queryId).forEach(function (t) {
                var tuple = zvs.getData(branchId, t);
                var data = zvs.getData(branchId, tuple.data);
            
                for (var i = 0; i < data.length; i++) {
                    const code = zvs.branches.getDataId(branchId, data[i]);
            
                    const v = zvs.getData(branchId, code);
                    const type = zvs.getData(branchId, v.type);
            
                    if (type === 'variable') {
                        variables.push(code);
                    }
                }
            });
        }
    
        function track({
            id,
            actives
        }) {
            const index = queriesIds.indexOf(id);
            if (!fail && actives === 0 && index !== -1) {
                queriesIds.splice(index, 1);
    
                if (queriesIds.length === 0) {
                    // mark checked negations,
                    for (var i=0; i<checked.length; i++) {
                        zvs.update(branchId, checked[i], {exists: false});
                        negations.splice(negations.indexOf(checked[i]), 1);
                    }
    
                    res.send({
                        value: {
                            branchId,
                            tuples,
                            negations
                        }
                    });
                }
            }
        }
    
        function success(branchId) {
            const queryBranchId = zvs.getObject(branchId, zvs.data.global("queryBranchId")).data;
    
            if (!fail && queriesIds.indexOf(queryBranchId) !== -1) {
                // A negation query has succeded, the branch fails,
                
                //        TODO:
                //            * fail branches,
                
                fail = true;
                events.off("track", track);
                events.off("success", success);
    
                res.send({});
            }
        }
    
        events.on("track", track);
        events.on("success", success);
    
        // find nots that can be executed,
        for (let j = negations.length - 1; j >= 0; j--) {
            ntuples = [negations[j]];
            var execute = true;
    
            while (ntuples.length > 0) {
                // TODO: we need to check and ignore duplicated tuples, because of variable replacing.
                code = zvs.branches.getDataId(branchId, ntuples.pop());
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
                    ntuples = ntuples.concat(data);
                }
            }
    
            if (execute) {
                checked.push(negations[i]);
                const neg = zvs.getObject(branchId, negations[i]);
                var nQueryId = zvs.data.add(
                    prepare.query(neg)
                );
    
                const definitionsBranchId = zvs.getData(branchId, zvs.getData(branchId, zvs.getData(branchId, zvs.data.global("definitions")).data).branchId);
                const queryBranchId = zvs.branches.getId({
                    parent: definitionsBranchId,
                    args: [nQueryId],
                    action: 'query'
                }).branchId;
                
                zvs.branches.transform(
                    queryBranchId,
                    zvs.data.global("queryBranchId"),
                    zvs.data.add({
                        type: 'query',
                        data: queryBranchId
                    })
                );
    
                zvs.branches.transform(queryBranchId, zvs.data.global("query"), nQueryId);
    
                if (queriesIds.indexOf(queryBranchId) === -1) {
                    queriesIds.push(queryBranchId);
                }
            }
        }
                
        if (!queriesIds.length) {
            // There is nothing to listen, just remove event listenners.
            events.off("track", track);
            events.off("success", success);
                    
            //
            res.send({
                value: {
                    branchId,
                    branches
                }
            });
        }
        else {
            // send branch to be processed 
            for (let i=0; i<queriesIds.length; i++) {
                const queryBranchId = queriesIds[i];
                events.trigger('add-checkDepth', {value: queryBranchId, trackId: queryBranchId});
            }
        }
    }
    
    if (branchId) {
        res.send({value: {branchId}});
    }
    else {
        res.send(value: {branches}})
    }*/
}

module.exports = negations;
