var fs = require("fs");

function getJSON (filename) {
	var template = JSON.parse(fs.readFileSync(filename));
	return template;
}


exports = {
	getJSON: getJSON
};
