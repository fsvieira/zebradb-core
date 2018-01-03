"use strict";

const should = require("should");
const utils = require("../utils");
const Session = require("../z");

const profile = require("../utils/profile");

function readFile (files) {

	return (filename) => {
		return new Promise((resolve, reject) => {
			const file = files[filename];

			if (file) {
				setTimeout(() => {
					resolve(file.data);
				}, file.delay || 0);
			}
			else {
				reject("File not found.");
			}
		});
	};
}

function trim (s) {
	return s.replace(/\n+/g, " ")
		.replace(/\t+/g, " ")
		.replace(/ +/g, " ")
		// TODO: we can't just remove spaces, its wrong...
		.replace(/ +/g, "")
		.trim();
}

function test (code, result, options) {
	options = options || {};

	return function () {

		if (options.timeout) {
			this.timeout(options.timeout);
		}

		return new Promise((resolve, reject) => {
			profile.reset();

			const session = new Session({
				readFile: readFile(options.files),
				settings: {
					depth: options.depth
				}
			});

			const queries = {};
			const keys = [];
			const queryId = session.zvs.data.global("query");

			const errors = [];

			session.events.on("error", error => errors.push(error));

			session.events.on("halt", () => {
				const s = [];

				profile.printCounters();

				for (let i = 0; i < keys.length; i++) {
					const branchQueryId = keys[i];
					const query = session.zvs.getObject(
						branchQueryId,
						session.zvs.data.global("query")
					);

					const queryBranch = session.zvs.branches.getBranch(
						branchQueryId
					);

					const functions =
						queryBranch.func ? [queryBranch.func] : [];

					const r = queries[branchQueryId];
					const results = [];

					if (r.branches.length > 0) {
						for (let j = 0; j < r.branches.length; j++) {
							const branchId = r.branches[j];

							if (functions.length) {
								for (let k=0; k<functions.length; k++) {
									let f = functions[k];
									let qString;
									let queryObject = session.zvs.getObject(
										branchId,
										queryId
									);

									qString = session.execute(f, queryObject);

									if (results.indexOf(qString) === -1) {
										results.push(qString);
									}
								}
								/*
								functions.forEach(function(f) {
									let qString;
									let queryObject = session.zvs.getObject(
										branchId,
										queryId
									);

									qString = session.execute(f, queryObject);

									if (results.indexOf(qString) === -1) {
										results.push(qString);
									}
								});*/
							}
							else {
								const qString = "\t" +
									utils.toString(
										session.zvs.getObject(
											branchId,
											queryId
										),
										true
									);

								if (results.indexOf(qString) === -1) {
									results.push(qString);
								}
							}
						}
					}
					else {
						results.push("\t<empty>");
					}

					s.push(
						"?" + utils.toString(query, true) + ":\n" +
						results.sort().join("\n")
					);
				}

				const r = (errors.length ?
					"Errors:\n" + errors.map(e => "\t" + e).join("\n") : "") +
					"\n" + s.join("\n");

				try {
					should(trim(r)).eql(trim(result));
					resolve();
				}
				catch (e) {
					reject(e);
				}
			});

			session.events.on("query-start", function (queryBranchId) {
				keys.push(queryBranchId);
				queries[queryBranchId] = queries[queryBranchId] ||
					{ branches: [], queries: [] };
			});

			session.events.on("success", function (branchId) {
				const queryBranchId = session.zvs.getObject(
					branchId,
					session.zvs.data.global("queryBranchId")
				).data;

				if (queries[queryBranchId]) {
					queries[queryBranchId].branches.push(branchId);
					/*
					TODO: why is this not working, Ids should be different:

					const qID = session.zvs.getUpdatedId(branchId, queryId);

					if (queries[queryBranchId].queries.indexOf(qID) === -1) {
					    queries[queryBranchId].queries.push(qID);
					    queries[queryBranchId].branches.push(branchId);
					}*/
				}
			});

			session.add({ value: code });
		});
	};
}

module.exports = test;
