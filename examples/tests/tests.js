var v = require("../../lib/variable").v;

function create_a_variable () {
	console.log("//// Create a Variable ////");
	var a = v();
	var b = v({value: "blue"});
	var c = v({domain: ["red", "blue", "green"]});
	var d = v({value: "blue", domain: ["red", "blue", "green"]});
	
	console.log(" == Code == ");
	console.log(
		'var a = v();"\n'
		+ 'var b = v({value: "blue"});\n'
		+ 'var c = v({domain: ["red", "blue", "green"]});\n'
		+ 'var d = v({value: "blue", domain: ["red", "blue", "green"]});'
	);
	console.log(" == Output == ");
	console.log("a = " + a.getValue() + "; [a] = " + a.getValues());
	console.log("b = " + b.getValue() + "; [b] = " + b.getValues());
	console.log("c = " + c.getValue() + "; [c] = " + c.getValues());
	console.log("d = " + d.getValue() + "; [d] = " + d.getValues());
	
	
};

create_a_variable();
