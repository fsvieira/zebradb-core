const should = require("should");
const {Z, toString} = require("../");

function test (definitions, queries) {
	return () => {
		should(definitions).be.type("string");
		should(queries).be.type("object");

		const dbname = "zebra.testing.database";
		const results = {};

		return Z.create(dbname)
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
						const queryResults = queries[q];

						should(queryResults).be.instanceof(Array);
						queryResults.sort();

						qs.push(
							db.query(q, (r) => {
								const qresults = results[q] = results[q] || [];

								const rs = toString(r, true);
								if (qresults.indexOf(rs) === -1) {
									qresults.push(rs);
								}
							})
						);
					}

					return Promise.all(qs);
				}
			)
			.then(
				() => {
					for (let q in queries) {
						const qs = queries[q];
						const rs = results[q] || [];

						rs.sort();

						should(
							q + ": " + rs.join(";\n")
						).eql(
							q + ": " + qs.join(";\n")
						);
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
