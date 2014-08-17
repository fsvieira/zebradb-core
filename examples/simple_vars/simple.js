var v = require("../../lib/variable").v;


function initVars () {
	console.log("== init vars === ");

	var a = v();
	var b = v({value: "blue"});
	var c = v({domain: ["red", "blue", "green"]});
	var d = v({value: "blue", domain: ["red", "blue", "green"]});

	console.log(a.getValue()); // undefined
	console.log(b.getValue()); // "blue"
	console.log(c.getValue()); // undefined
	console.log(d.getValue()); // "blue"

};

function unifyFail () {
	console.log("== unify fail === ");
	var a = v({value: "blue"});
	var b = v({value: "yellow"});
	console.log(a.unify(b)); // false
};

function domainUnify () {
	console.log("== domain unify === ");
	var a = v({domain: [1, 2, 3]});
	var b = v({domain: [3, 4, 5]});

	console.log(a.getValue()); // undefined
	console.log(b.getValue()); // undefined

	a.unify(b);
	console.log(a.getValue()); // 3
	console.log(b.getValue()); // 3	
}

initVars();
unifyFail();
domainUnify();
