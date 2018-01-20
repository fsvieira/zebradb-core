const Session = require("../manager/manager");

let transaction = 0;
let databases = {};

class Z {
	constructor (name, session) {
		this.name = name;
		this.session = session;
		this.transactions = {};

		const events = this.session.events;

		// TODO: we need error with trackId,
		events.on("error", ({id, error}) => {
			const t = this.transaction[id];
			const {reject} = t;
			delete this.transaction[id];
			reject(error);
		});


		// TODO: we need success with tackId,
		// events.on("success", )
		events.on("success", ({id, branchId}) => {
			const {callback} = this.transactions[id];
			const result = session.zvs.getObject(
				branchId,
				session.zvs.data.global("query")
			);

			callback(result);
		});

		events.on("end", ({id}) => {
			const {resolve} = this.transactions[id];

			delete this.transactions[id];
			resolve(this);
		});
	}

	create ({id, description, definitions}) {
		return new Promise((resolve, reject) => {
			if (id && definitions && description) {

				const tId = transaction++;
				this.transactions[tId] = {resolve, reject};

				this.session.add({value: definitions, trackId: tId});
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
			const tId = transaction++;

			this.transactions[tId] = {resolve, reject, callback};
			this.session.add({value: q, trackId: tId});
		});
	}
}


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
			databases[dbname] = new Z(dbname, new Session({}));
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

function list ()  {
	return new Promise(resolve => resolve(Object.keys(databases)));
}


module.exports = {
	create,
	connect,
	remove,
	list
};

