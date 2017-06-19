const prepare = require("../prepare");

function getTuples(zvs, branchId, q, ignoreChecked) {
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

// TODO: this function is duplicated on definitions, put it on own file.
function branch(zvs, {
    parentBranchId,
    action,
    args
}) {
    const parent = zvs.branches.getRawBranch(parentBranchId);

    if (parent.metadata) {
        Object.freeze(parent.metadata.changes);
    }

    return zvs.branches.branchHash({
        parent: parentBranchId,
        args: args.slice(0),
        action: action,
        level: parent.data.level + 1
    });
}

function negations(zvs, events) {
    const queryId = zvs.data.global("query");

    return function({
        branchId,
        tuples,
        negations
    }) {
        return new Promise(function(resolve, reject) {
            const variables = [];

            getTuples(zvs, branchId, queryId, true).forEach(function(t) {
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

            var tuples;
            var code;
            var v;
            var type;
            var data;
            var fail = false;
            var queriesIds = [];

            function track({
                id,
                actives
            }) {
                const index = queriesIds.indexOf(id);
                if (!fail && actives === 0 && index !== -1) {
                    queriesIds.splice(index, 1);
                }
            }

            function success(branchId) {
                const queryBranchId = zvs.getObject(branchId, zvs.data.global("queryBranchId")).data;
                if (!fail && queriesIds.indexOf(queryBranchId) !== -1) {
                    // A negation query has succeded, the branch fails,
                    /*
                    TODO:
                        * fail branches,
                    */
                    fail = true;
                    events.off("track", track);
                    events.off("success", success);

                    resolve({});
                }
            }

            events.on("track", track);
            events.on("success", success);

            // find nots that can be executed,
            for (var i = negations.length - 1; i >= 0; i--) {
                tuples = [negations[i]];
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
                    const neg = zvs.getObject(branchId, negations[i]);
                    var nQueryId = zvs.data.add(
                        prepare.query(neg)
                    );

                    const definitionsBranchId = zvs.getData(zvs.getData(branchId, zvs.global("definitions")).branchId);

                    const queryBranchId = branch(
                        zvs, {
                            parentBranchId: definitionsBranchId,
                            action: 'query',
                            args: [nQueryId]
                        }
                    );

                    zvs.branches.transform(
                        queryBranchId,
                        zvs.data.global("queryBranchId"),
                        zvs.data.add({
                            type: 'query',
                            data: queryBranchId
                        })
                    );

                    zvs.branches.transform(queryBranchId, zvs.data.global("query"), nQueryId);

                    queriesIds.push(queryBranchId);
                    
                    // send branch to be processed 
                    events.trigger('queries', {value: queryBranchId, trackId: queryBranchId});
                }
            }
            
            if (!queriesIds.length) {
                // There is nothing to listen, just remove event listenners.
                events.off("track", track);
                events.off("success", success);
            }
        });
    };
}

module.exports = negations;
