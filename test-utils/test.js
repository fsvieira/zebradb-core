"use strict";

const should = require("should");
const {Z, toString} = require("../");
const ZTL = require("ztl");

function normalize (s) {
	if (typeof s === "string") {
		return s
			.replace(/[\n\t ]+/g, " ")
			.trim()
		;
	}

	return s;
}

/*
function queryCallback (db, q, results) {
	return (r, f) => {
		const qresults = results[q] = results[q] || [];

		const rs = f ? db.execute(f, r) : toString(r, true);

		if (qresults.indexOf(rs) === -1) {
			qresults.push(rs);
		}
	};
}*/

function queryCallback (db, q, results, f, ztlDesc) {
	if (!f && ztlDesc) {
		const ztl = new ZTL();
		ztl.compile(ztlDesc.code);
		f = (r) => ztl.fn[ztlDesc.main](r);
	} 

	return r => {
		const qresults = results[q] = results[q] || [];

		const rs = f ? f(r) : toString(r, true);

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

function getPostProcessingFunction (query) {

	let f = query.postProcessing;

	if (!f && query.ztl) {
		const ztl = new ZTL();
		ztl.compile(query.ztl.code);
		return r => ztl.fn[ztlDesc.main](r);
	}

	return f || (r => toString(r, true));
}

function test (definitions, queries, options) {
	const dbname = "zebra.testing.database";

	should(definitions).be.type("string");
	should(queries).be.instanceof(Array);
	options = options || {};

	return async function () {
		if (options.timeout) {
			this.timeout(options.timeout);
		}

		await Z.create(
			dbname,
			{
				settings: {
					depth: options.depth
				}
			}
		);

		const db = await Z.connect(dbname);
		await db.execute(definitions);

		for (let q in queries) {
			if (queries.hasOwnProperty(q)) {
				const queryObject = queries[q];

				should(queryObject.results).be.instanceof(Array);
				queryObject.results = queryObject
					.results
					.map(normalize);

				queryObject.results.sort();

				queryObject.query = normalize(queryObject.query);
				queryObject.id = await db.execute(queryObject.query);
			}
		}

		for (let q in queries) {
			if (queries.hasOwnProperty(q)) {
				const qo = queries[q];
				const f = getPostProcessingFunction(qo);				
				const {query, results: qs, id} = qo;
				const rs = (await db.postOffice.pull(id))
					.map(b => normalize(
							f(
								db.zvs.getObject(
									b, 
									db.zvs.data.global("query")
								)
							)
						)
					)
					.sort();
	
				should(
					query + ": " + rs.join(";\n")
				).eql(
					query + ": " + qs.join(";\n")
				);
			}
		}

		await Z.remove(dbname);
	}
}

module.exports = test;
