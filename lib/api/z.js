const Session = require("../manager/manager");

let databases = {};

/*
	Databases starting with zebradb. are reserved.
*/

function create (dbname) {
	return new Promise((resolve, reject) => {
		const db = databases[dbname];

		if (db) {
			reject("database alredy exists!");
		}
		else {
			databases[dbname] = new Session({});
			resolve(dbname);
		}
	});
}

function remove (dbname) {
	return new Promise((resolve, reject) => {
		delete databases[dbname];

		resolve(dbname);
	});
}

function connect (dbname) {
	return new Promise((resolve, reject) => {
		const db = databases[dbname];

		if (db) {
			resolve(db);
		}
		else {
			reject(dbname + " doens't exist");
		}
	});
}

function list () {
	return new Promise(resolve => resolve(Object.keys(databases)));
}

module.exports = {
	create,
	connect,
	remove,
	list
};

