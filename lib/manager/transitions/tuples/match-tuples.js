"use strict";

function getTuplesDefinitions (branchId, tuples, match) {
    const matchTuples = {};

    for (let i=0; i<tuples.length; i++) {
        const tupleID = tuples[i];
        var definitions = match.match(branchId, tupleID);

        if (definitions && definitions.length) {
            matchTuples[tupleID] = definitions;
        }
        else {
            return;
        }
    }

    return matchTuples;
}

function matchTuples (req, res) {
    const {branchId, tuples} = req.args;
    const {zvs} = req.context;

    const ddata = zvs.getData(branchId, zvs.data.global("definitions")).data;
    const definitionsBranchId = zvs.getData(
    	branchId,
    	zvs.getData(branchId, ddata).branchId
    );

    const match = zvs.definitionsMatch[definitionsBranchId];

    // Get tuples definitions,
    const matchTuples = getTuplesDefinitions(branchId, tuples, match);

    if (!matchTuples) {
        res.send({});
        return;
    }

    const tuplesDefinitions = tuples.map(tuple => {
        return {
            tuple,
            definitions: matchTuples[tuple]
        };
    });

    if (tuplesDefinitions) {
        res.send({
            value: {
                branchId,
                tuples: tuplesDefinitions
            }
        });
    }
    else {
        res.send({});
    }
}

module.exports = matchTuples;

