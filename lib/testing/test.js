"use strict";

const should = require("should");
const {Z, toString} = require("../");

function normalize (s) {
	if (typeof s === "string") {
		return s
			.replace(/[\n\t ]+/g, " ")
			.trim()
		;
	}

	return s;
}

function queryCallback (db, q, results) {
	return (r, f) => {
		const qresults = results[q] = results[q] || [];
		const rs = f ? db.execute(f, r) : toString(r, true);

		if (qresults.indexOf(rs) === -1) {
			qresults.push(rs);
		}
	};
}

function queryErrorHandler (q, results) {
	return error => {
		// it should always contain one error,
		// but if it gets more, we will detect it.
		const qresults = results[q] = results[q] || [];

		qresults.push(error);

		return Promise.resolve(error);
	};
}

function test (definitions, queries, options) {
	options = options || {};

	return function () {
		if (options.timeout) {
			this.timeout(options.timeout);
		}

		should(definitions).be.type("string");
		should(queries).be.instanceof(Array);

		const dbname = "zebra.testing.database";
		const results = {};

		return Z.create(
			dbname,
			{
				settings: {
					depth: options.depth
				}
			}
		)
			.then(dbname => Z.connect(dbname))
			.then(
				db => db.create({
					id: "tests",
					description: "Do some tests",
					definitions
				})
			)
			.then(
				db => {
					const qs = [];

					for (let q in queries) {
						if (queries.hasOwnProperty(q)) {
							// TODO: check queries objects,
							const queryObject = queries[q];

							should(queryObject.results).be.instanceof(Array);
							queryObject.results = queryObject
								.results
								.map(normalize);

							queryObject.results.sort();

							queryObject.query = normalize(queryObject.query);

							qs.push(
								db.query(
									queryObject.query,
									queryCallback(db, q, results)
								).then(
									r => r,
									queryErrorHandler(q, results)
								)
							);
						}
					}

					return Promise.all(qs);
				}
			)
			.then(
				() => {
					for (let q in queries) {
						if (queries.hasOwnProperty(q)) {
							const {query, results: qs} = queries[q];
							const rs = (results[q] || []).map(normalize);

							rs.sort();

							should(
								query + ": " + rs.join(";\n")
							).eql(
								query + ": " + qs.join(";\n")
							);
						}
					}
				}
			)
			.then(
				() => Z.remove(dbname),
				(error) => {
					Z.remove(dbname);
					return Promise.reject(error);
				}
			);
	};
}

module.exports = test;
