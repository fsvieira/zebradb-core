"use strict";

function _updateQuery (req, res) {
	const branchId = req.args;
	const { zvs } = req.context;
	/*
	    const queryId = zvs.getUpdatedId(branchId, zvs.data.global("query"));

	    if (!queryId) {
	        res.send({});
	        return;
	    }
	*/
	const queryId = zvs.branches.getDataId(branchId, zvs.data.global("query"));

	res.send({ value: { branchId, queryId } });
}

function updateQuery (action, data, destination, session) {
	const branchId = data;
	const zvs = session.zvs;

	const queryId = zvs.branches.getDataId(branchId, zvs.data.global("query"));

	session.postOffice.addActives(destination, 1);
	session.queue.put({
		action: "filterUncheckedTuples", 
		data: { 
			branchId, 
			queryId 
		},
		destination
	});

	session.postOffice.subActives(destination, 1);
}

module.exports = updateQuery;
