"use strict";
const utils = require("../../../utils");

function splitUncheckedDomain (req, res) {
	const { zvs } = req.context;
	const {branchId, domainId } = req.args;
 
    const domain = zvs.getData(branchId, domainId);
    const data = zvs.getData(branchId, domain.data);

    utils.printQuery(zvs, branchId, "START DOMAIN!!");

    const branches = [];
    for (let i=0; i<data.length; i++) {
        const id = data[i];

        const { branchId: newBranchId } = zvs.branches.getId({
            parent: branchId,
            args: [domainId, id],
            action: "splitDomain"
        });

        branches.push(newBranchId);

        zvs.branches.transform(
            newBranchId,
            domainId,
            id
        );

        utils.printQuery(zvs, newBranchId, "DOMAIN SPLIT!!");
    }

    res.send({values: branches});
}

module.exports = splitUncheckedDomain;
