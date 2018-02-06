"use strict";

const Kanban = require("./kanban");
const ZVS = require("../zvs/zvs");
const Events = require("../events");

const { include, parse } = require("./transitions/parsing");
const { storeFunctions } = require("./transitions/functions");

const {
	prepareDefinitions,
	checkDefinitions,
	multiplyDefinitions,
	prepare
} = require("./transitions/definitions");

const {
	prepareQuery,
	checkDepth,
	updateQuery
} = require("./transitions/query");

const {
	matchTuples,
	copyDefinitions,
	filterUncheckedTuples,
	check
} = require("./transitions/tuples");

const {
	filterUncheckedNegations,
	negations
} = require("./transitions/negations");

const {
	merge
} = require("./transitions/merge");

const {
	success
} = require("./transitions/success");


function exists (session) {
	return (branchId, tupleId) => {
		return new Promise((resolve, reject) => {
			const neg = session.zvs.getObject(branchId, tupleId);

			const nQueryId = session.zvs.data.add(
				prepare.query(neg)
			);

			const definitionsBranchId = session.zvs.getData(
				branchId,
				session.zvs.getData(
					branchId,
					session.zvs.getData(
					    branchId,
					    session.zvs.data.global("definitions")
                    ).data
				).branchId
			);

			const { branchId: queryBranchId } = session.zvs.branches.getId({
				parent: definitionsBranchId,
				args: [nQueryId],
				action: "query"
			});

			session.zvs.branches.transform(
				queryBranchId,
				session.zvs.data.global("queryBranchId"),
				session.zvs.data.add({
					type: "query",
					data: queryBranchId
				})
			);

			session.zvs.branches.transform(
				queryBranchId,
				session.zvs.data.global("query"),
				nQueryId
			);

			let queryExists = false;

			session.internalQuery(queryBranchId, r => {
				if (!queryExists) {
					queryExists = true;
					session.zvs.update(branchId, tupleId, { exists: true });
					reject();
				}
			}).then(() => {
				if (queryExists === false) {
					session.zvs.update(branchId, tupleId, { exists: queryExists });
					resolve();
				}
			});
		});
	};
}

/*
function exists (zvs, events) {

	const queries = {};

	function track ({
		id,
		actives
	}) {

		if (actives === 0) {
			const query = queries[id];

			if (query !== undefined) {
				delete queries[id];

				query.forEach(({ branchId, tupleId, resolve }) => {
					zvs.update(branchId, tupleId, { exists: false });
					resolve(tupleId);
				});
			}
		}
	}

	function trackSuccess ({id: tackId, branchId: successBranchId}) {
		const id = zvs.getObject(
			successBranchId,
			zvs.data.global("queryBranchId")
		).data;

		const query = queries[id];

		if (query !== undefined) {
			delete queries[id];

			query.forEach(({ branchId, tupleId, reject }) => {
				zvs.update(branchId, tupleId, { exists: true });
				reject();
			});
		}
	}

	events.on("track", track);
	events.on("success", trackSuccess);

	return (branchId, tupleId) => {
		return new Promise((resolve, reject) => {
			const neg = zvs.getObject(branchId, tupleId);

			const nQueryId = zvs.data.add(
				prepare.query(neg)
			);

			const definitionsBranchId = zvs.getData(
				branchId,
				zvs.getData(
					branchId,
					zvs.getData(branchId, zvs.data.global("definitions")).data
				).branchId
			);

			const { branchId: queryBranchId, exists } = zvs.branches.getId({
				parent: definitionsBranchId,
				args: [nQueryId],
				action: "query"
			});

			const query = queries[queryBranchId] = queries[queryBranchId] || [];

			query.push({
				resolve,
				reject,
				branchId,
				tupleId
			});

			if (!exists) {

				zvs.branches.transform(
					queryBranchId,
					zvs.data.global("queryBranchId"),
					zvs.data.add({
						type: "query",
						data: queryBranchId
					})
				);

				zvs.branches.transform(
					queryBranchId,
					zvs.data.global("query"),
					nQueryId
				);
			}

			//    TODO:
			//        - if query exists then:
			//            * its running and no need for new query or ...
			//            * it has a result and so we can solve it
			//              without running query.


			//    TODO:
			//        - use prepare query phase insted ??

			events.trigger(
				"add-checkDepth", {
					value: queryBranchId,
					trackId: queryBranchId
				}
			);
		});
	};
}*/

function setupEvents (session) {
    const {
        zvs,
        events,
        transactions
    } = session;

    // TODO: we need error with trackId,
	events.on("error", ({trackId, error}) => {
		const {reject} = transactions[trackId];

		delete transactions[trackId];

		reject(error);
	});

	events.on("success", ({trackId, branchId}) => {
		const queryBranchId = session.zvs.getObject(
		    branchId,
			session.zvs.data.global("queryBranchId")
        ).data;

        const queryBranch = session.zvs.branches.getBranch(
			queryBranchId
		);

        const functions = queryBranch.func;

		const result = zvs.getObject(
			branchId,
			zvs.data.global("query")
		);

		const {callback} = transactions[trackId];
		callback(result, functions);
	});

	events.on("end", ({trackId}) => {
		const {resolve} = transactions[trackId];

		delete transactions[trackId];

		resolve(session);
	});

/*
	events.on("query-start", ({queryBranchId, trackIds}) => {
		let qt = queryTransactions[queryBranchId];

		if (qt === undefined) {
			qt = queryTransactions[queryBranchId] = session.transaction++;
		}

		transactions[qt] = trackIds.reduce(
			(acc, trackId) => {
				const ts =  transactions[trackId];
				delete transactions[trackId];
				return acc.concat(ts);
			},
			transactions[qt] || []
		);
	});*/
}

class Session {

	constructor ({ events = new Events(), readFile, settings }) {

        // Setup,
		this.events = events;
		this.zvs = new ZVS(this.events);

		this.zvs.update(
			this.zvs.branches.root,
			this.zvs.data.global("settings"), {
				data: settings
			}
		);

        // Setup transactions,
        this.transaction = 0;
        this.transactions = {};

        setupEvents(this);

        // Setup variables and pipeline,
		this.functions = {};

		const pipeline = {
			transitions: {
				// Parsing,
				files: {
					process: include,
					to: ["texts"]
				},
				texts: {
					process: parse,
					to: ["files", "prepareDefinitions", "storeFunctions"],
					dispatch: value => {
						if (value.type === "include") {
							return "files";
						}
						else if (value.type === "function") {
							return "storeFunctions";
						}

						return "prepareDefinitions";
					}
				},

				// Functions,
				storeFunctions: {
					process: storeFunctions
				},

				// definitions,
				prepareDefinitions: {
					process: prepareDefinitions,
					to: ["checkDefinitions"]
				},
				checkDefinitions: {
					process: checkDefinitions(false),
					to: ["multiplyDefinitions"]
				},
				multiplyDefinitions: {
					process: multiplyDefinitions,
					to: ["checkMultiplyDefinitions"]
				},
				checkMultiplyDefinitions: {
					process: checkDefinitions(true),
					to: ["prepareQuery"]
				},

				// Query,
				prepareQuery: {
					process: prepareQuery,
					to: ["checkDepth"]
				},
				checkDepth: {
					process: checkDepth,
					to: ["updateQuery"]
				},
				updateQuery: {
					process: updateQuery,
					to: ["filterUncheckedTuples"]
				},

				// Tuples,
				filterUncheckedTuples: {
					process: filterUncheckedTuples,
					to: ["filterUncheckedNegations", "matchTuples"],
					dispatch: value => {
						if (value.tuples.length === 0) {
							return "filterUncheckedNegations";
						}

						return "matchTuples";
					}
				},
				matchTuples: {
					process: matchTuples,
					to: ["copyDefinitions"]
				},
				copyDefinitions: {
					process: copyDefinitions,
					to: ["check"]
				},
				check: {
					process: check,
					to: ["filterUncheckedNegations"]
				},

				// Negations,
				filterUncheckedNegations: {
					process: filterUncheckedNegations,
					to: ["negations"]
				},
				negations: {
					process: negations,
					to: ["merge", "success", "checkDepth"],
					dispatch: value => {
						if (value.branchId !== undefined) {
							return "success";
						}

						if (value.branches && value.branches.length > 1) {
							return "merge";
						}

						return "checkDepth";
					}
				},

				// Merge,
				merge: {
					process: merge,
					to: ["filterUncheckedNegations"]
				},
				success: {
					process: success
				}
			},
			ordered: ["files", "prepareDefinitions", "checkDefinitions"],
			start: "texts",
			context: {
				zvs: this.zvs,
				events,
				readFile,
				exists: exists(this)
			},
			store: {
				files: [],
				definitions: [],
				functions: this.functions,
				id: 0
			}
		};

		this.kanban = new Kanban(pipeline, this.events);
	}

	execute (funcname, query) {
		const f = this.functions[funcname];
		return f.execute(query);
	}

	add (value) {
		this.kanban.add(value);
	}

	// DB methods,
	create ({id, description, definitions}) {
		return new Promise((resolve, reject) => {
			if (id && definitions && description) {

				const tId = this.transaction++;
				this.transactions[tId] = {resolve, reject};

				this.add({value: definitions, trackId: tId});
			}
			else {
				reject("Id, description or definitions are undefined!");
			}
		});
	}

	update ({id, description, definitions, renameId}) {

	}

	remove (id) {

	}

	query (q, callback) {
		return new Promise ((resolve, reject) => {
			const tId = this.transaction++;

			this.transactions[tId] = {resolve, reject, callback};
			this.add({value: q, trackId: tId});
		});
	}

	internalQuery (queryBranchId, callback) {
		return new Promise((resolve, reject) => {
			const tId = this.transaction++;

			this.transactions[tId] = {resolve, reject, callback};

			this.events.trigger(
				"add-checkDepth", {
					value: queryBranchId,
					trackId: tId
				}
			);
		});
	}
}

module.exports = Session;
