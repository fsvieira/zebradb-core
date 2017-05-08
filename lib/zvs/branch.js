/*
	Branch Class,
	* used as temporary object on zvs.change function.
*/
function Branch (
	zvs,
	id
) {
	this.zvs = zvs;
	this.id = id;
	this.counter = 0;
}

Branch.prototype.uniqueId = function () {
	return this.id + "$" + this.counter++;
};

Branch.prototype.get = function (code) {
	return this.zvs.getData(this.id, code);
};

Branch.prototype.getId = function (code) {
	return this.zvs.branches.getDataId(this.id, code);
};
		
// Call action to change data,
Branch.prototype.change = function (action, args, branch) {
	return this.zvs.change(action, args, branch || this.id);
};

// Tranform a hash code to other hash code (tran)
Branch.prototype.transform = function (oldCode, newCode) {
	return this.zvs.branches.transform(this.id, oldCode, newCode);
};

// It updates the object fields.
Branch.prototype.update = function (code, obj) {
	this.zvs.update(this.id, code, obj);
};

Branch.prototype.getObject = function (code) {
	return this.zvs.getObject(code, this.id);
};

Branch.prototype.notes = function (notes) {
	var branch = this.zvs.branches.getRawBranch(this.id);
	branch.metadata.notes = branch.metadata.notes || {};
	Object.assign(branch.metadata.notes, notes);
};

Branch.prototype.global = function (name) {
	return this.zvs.data.global(name);
};

Branch.prototype.hash2branch = function (hash) {
	return new Branch(this.zvs, hash);
};


Branch.prototype.getLevel = function () {
	return this.zvs.branches.getLevel(this.id);
};

module.exports = Branch;

