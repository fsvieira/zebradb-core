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


// Call action to change data,
/*
Branch.prototype.change = function (action, args, branch) {
	return this.zvs.change(action, args, branch || this.id);
};
*/


Branch.prototype.hash2branch = function (hash) {
	return new Branch(this.zvs, hash);
};


module.exports = Branch;

