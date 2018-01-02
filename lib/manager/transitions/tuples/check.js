"use strict";

const actionUnify = require("./actionUnify");

function check (req, res) {
    const {zvs} = req.context;
    const {branchId, tuples: mergeTuples} = req.args;

    const queryId = zvs.data.global("query");
    const merge = [];

    for (let i=0; i<mergeTuples.length; i++) {
        const {tuple, definitions} = mergeTuples[i];
        const r = [];

        for (let j=0; j<definitions.length; j++) {
            const {negation, definition} = definitions[j];
            const unifyBranchId = actionUnify(
            	zvs,
            	{branchId, args: [tuple, definition]}
            );

            if (unifyBranchId) {
                if (negation && negation.length > 0) {
                    const query = Object.assign(
                    	{},
                    	zvs.getData(unifyBranchId, queryId)
                    );

                    const qnegation = zvs.getData(
                    	unifyBranchId,
                    	query.negation
                    ).slice(0);

                    for (let n=0; n<negation.length; n++) {
                        const nId = zvs.data.add(negation[n]);

                        if (qnegation.indexOf(nId) === -1) {
                            qnegation.push(nId);
                        }
                    }

                    query.negation = zvs.data.getId(qnegation.sort());
                    zvs.branches.transform(
                    	unifyBranchId,
                    	queryId,
                    	zvs.data.getId(query)
                    );
                }

                // events.trigger('branch', {branchId: unifyBranchId});
                r.push(unifyBranchId);
                /*r.push({
                    branchId: unifyBranchId,
                    tuple,
                    definition
                });*/
            }
        }

        if (r.length > 0) {
            merge.push(r);
        }
        else {
            // branch fails,
            // TODO: we need to mark branch as fail.
            res.send({});
            return;
        }
    }

    res.send({value: {branches: merge}});
}


module.exports = check;