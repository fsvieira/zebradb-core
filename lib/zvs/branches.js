const Ids = require("./ids");
// const profile = require("../utils/profile");

class Branches {

	constructor () {
		this.ids = new Ids();

		this.branches = {};
		this.root = this.getId({
			action: "init",
			level: 0
		}).branchId;
	}

	getId (obj) {
		if (obj.level === undefined) {
			if (obj.parent) {
				const parent = this.getRawBranch(obj.parent);
				obj.level = parent.data.level + 1;
			}
			else {
				obj.level = 0;
			}
		}

		Object.freeze(obj);
		const branchId = this.ids.id(obj);
		let exists = true;

		if (!this.branches[branchId]) {
			exists = false;
			this.branches[branchId] = {
				data: obj,
				metadata: {
					changes: {},
					counter: 0
				}
			};

			if (obj.parent !== undefined) {
				let parents;

				if (obj.parent instanceof Array) {
					parents = obj.parent;
				}
				else {
					parents = [obj.parent];
				}

				parents.forEach(parentBranchId => {
					const branch = this.getRawBranch(parentBranchId);

					branch.metadata.status = branch.metadata.status || {};

					if (!branch.metadata.status.closed) {
						branch.metadata.status.closed = true;
						Object.freeze(branch.metadata.changes);
					}
				});
			}
		}

		return { branchId, exists };
	}

	getRawBranch (id) {
		return this.branches[id];
	}

	getBranch (id) {
		let branch = this.getRawBranch(id);
		return branch ? branch.data : undefined;
	}

	getDataId (branchId, id) {
		if (id === undefined) {
			return;
		}

		let c;
		let b;
		let bh = branchId;

		do {
			id = c || id;
			b = this.getRawBranch(bh);
			c = b.metadata.changes[id];

			if (c === undefined) {
				if (typeof b.data.parent === "number") {
					bh = b.data.parent;
				}
				else {
					c = id;
				}
			}
			else {
				bh = branchId;
			}
		} while (c !== id);

		return c;
	}

	transform (branchId, oldId, newId) {
		oldId = this.getDataId(branchId, oldId);
		newId = this.getDataId(branchId, newId);
		if (oldId !== newId) {
			this.getRawBranch(branchId).metadata.changes[oldId] = newId;
		}
	}

	getLevel (id) {
		return this.getBranch(id).level;
	}

	end ({ rootBranchId, branchId, success, fail, reason }) {
		let branch = this.getRawBranch(branchId);

		branch.metadata.status = branch.metadata.status || {};

		branch.metadata.status.end = true;
		branch.metadata.status.fail = fail;
		branch.metadata.status.success = success;
		branch.metadata.status.reason = reason;

		if (!branch.metadata.status.closed) {
			branch.metadata.status.closed = true;

			Object.freeze(branch.metadata.changes);
		}

		if (rootBranchId && success) {
			const branch = this.getRawBranch(rootBranchId);
			branch.metadata.results = branch.metadata.results || [];

			if (branch.metadata.results.indexOf(branchId) === -1) {
				branch.metadata.results.push(branchId);
			}
		}
	}

	getUniqueId (id) {
		return id + "$" + this.getRawBranch(id).metadata.counter++;
	}
}

// profile.profileClass(Branches);

module.exports = Branches;
