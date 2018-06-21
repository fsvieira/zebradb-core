"use strict";

const utils = require("../utils");

const {Kanban, Events} = require("kanban-pipeline");
const ZVS = require("../zvs/zvs");

const { parse } = require("./transitions/parsing");
const { storeFunctions } = require("./transitions/functions");

const { multiplyFlop } = require("../flop");

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
	check,
	domains
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

			let flop;
			let self = false;

			// utils.printQuery(session.zvs, queryBranchId, "Negation");

			session.internalQuery(queryBranchId, (r, f, b) => {
				const d = session.zvs.getObject(b, session.zvs.data.global("flop"));
				
				if (!queryExists) {
					if (d.data && d.data.length) {
						// if we are able to fail this result, then add to flop,
						/**
						 * TODO:
						 * 	- all branches should fail with same conditions,
						 *  - multiply flops of diferent branches,
						 *  - if flops are empty then reject.
						 */
						// flop = flop.concat(d.data);
						flop = multiplyFlop(flop, d);
						if (!flop.data.length) {
							queryExists = true;
							session.zvs.update(branchId, tupleId, { exists: true });
							reject();
						} 
					}
					else {
						// result can not be failed, reject.
						queryExists = true;
						session.zvs.update(branchId, tupleId, { exists: true });
						reject();
					}
				}
				else {
					// query fails by itself.
					self = true;
				}
			}).then(() => {
				if (queryExists === false) {
					session.zvs.update(
						branchId,
						tupleId,
						{ exists: queryExists }
					);

					resolve({flop, self});
				}
			});
		});
	};
}

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
		callback(result, functions, branchId);
	});

	events.on("end", ({trackId}) => {
		const {resolve} = transactions[trackId];

		delete transactions[trackId];

		resolve(session);
	});
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
				texts: {
					process: parse,
					to: ["prepareDefinitions", "storeFunctions"],
					dispatch: value => {
						if (value.type === "function") {
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
					to: [
						"filterUncheckedNegations", 
						"matchTuples" /*,
						"splitUncheckedDomains"*/
					],
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
					to: ["domains"]
				},
				/*
					- negations are checked after domain construction,
					because even if we check them before, it will need 
					to be re-checked after because individual tuples
					may not contain all variable values necessary 
					to eval a negation.
				*/
				domains: {
					process: domains,
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
			/*
				TODO:
					* this states no longer need to be ordered,
					* we need to create kanban.js project and document
					  its features,
			*/
			ordered: ["prepareDefinitions", "checkDefinitions"],
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

	/*
	update ({id, description, definitions, renameId}) {

	}

	remove (id) {

	}
	*/

	query (q, callback) {
		return new Promise((resolve, reject) => {
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
