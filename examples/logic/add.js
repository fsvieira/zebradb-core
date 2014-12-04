var Variable = require("../../lib/variable");
var backtrack = require("../../lib/backtrack");
var factory = new Variable();
var v = factory.v;

function Facts (values, factory, args, callback) {
	return function () {
		values.forEach(function (value) {
			if (value.length === args.length) {
				var ok = true;
				var version = factory.commit();
				for (var i=0; i<args.length; i++) {
					ok = value[i].unify(args[i]);
					if (!ok) {break;}
				}
			
				if (ok) {
					callback(args);
				}
				
				factory.reset(version);
			}
		});
	};
};

function AND (p, q, r, callback) {
	return Facts ([
		[v({domain: [0]}), v({domain: [0]}), v({domain: [0]})],
		[v({domain: [0]}), v({domain: [1]}), v({domain: [0]})],
		[v({domain: [1]}), v({domain: [0]}), v({domain: [0]})],
		[v({domain: [1]}), v({domain: [1]}), v({domain: [1]})]
	], factory, [p, q, r], callback);	
};


function ADD (p, q, c, r, cc, callback) {
	return Facts ([
		[v({domain: [0]}), v({domain: [0]}), v({domain: [0]}), v({domain: [0]}), v({domain: [0]})],
		[v({domain: [0]}), v({domain: [0]}), v({domain: [1]}), v({domain: [1]}), v({domain: [0]})],
		[v({domain: [0]}), v({domain: [1]}), v({domain: [0]}), v({domain: [1]}), v({domain: [0]})],
		[v({domain: [0]}), v({domain: [1]}), v({domain: [1]}), v({domain: [0]}), v({domain: [1]})],
		[v({domain: [1]}), v({domain: [0]}), v({domain: [0]}), v({domain: [1]}), v({domain: [0]})],
		[v({domain: [1]}), v({domain: [0]}), v({domain: [1]}), v({domain: [0]}), v({domain: [1]})],
		[v({domain: [1]}), v({domain: [1]}), v({domain: [0]}), v({domain: [0]}), v({domain: [1]})],
		[v({domain: [1]}), v({domain: [1]}), v({domain: [1]}), v({domain: [1]}), v({domain: [1]})],
	], factory, [p, q, c, r, cc], callback);
};

function MULn (p, q, r, callback) {

	var grid = [];
	var l = p.length;
		
	var f = function () {
		callback(p, q, r);
	};
	
	for (var i=0; i<l; i++) {
		var line = [];
		for (var j=0; j<i; j++) {
			line.push(v({domain: [0]}));
		}

		p.forEach(function (_p, index) {
			var a = v();
			var b = q[i];

			f = AND(_p, b, a, f);
			line.push(a);
		});
		
		for (var j=line.length; j<r.length; j++) {
			line.push(v({domain: [0]}));
		}
		
		grid.push(line);
		var gl = grid.length;
		if ((gl > 0) && !(grid.length&1)) {
			// 1, 2, [3], 4, [5]
			// save intermidiate add results.
			var line;
			if (i===l-1) {
				line = r;
			}
			else {
				line = [];
				for (var j=0; j<r.length; j++) {
					line.push(v());
				}
			}

			grid.push(line);
			// 0 1 [2], 2-2=0, 2-1=1, 2
			
			f = ADDn(grid[gl-2], grid[gl-1], grid[gl], f);
		}
	}
	
	return f;
};


function ADDn (p, q, r, callback) {
	var c = v({domain: [0]});
	
	var f = function () {
		callback(p, q, r);
	};
	
	p.forEach (function (_p, index) {
		var cc = v();
		f = ADD(_p, q[index], c, r[index], cc, f);
		c = cc;
	});
	
	// --- overflow flag 
	// c.unify(r[r.length-1]);
	
	return f;
};

function add (p , q, r, digits, callback) {
	return ADDn (fromNumber(p, digits), fromNumber(q, digits), fromNumber(r, digits), callback);
};

function toNumber(n, unsigned) {
	var r = 0; 
	n.forEach (function (d, index) {
		if (r!==undefined) {
			if (d.getValue() === undefined) {
				r = undefined;
			}
			else {
				r = r + (d.getValue() << index);
			}
		}
	});
	
	if (!unsigned) {
		if (n[n.length-1].getValue() === 1) {
			r = (-1 << n.length) | r;
		}
	}
	
	return r;
};

function toBits(n) {
	var r = "";
	n.forEach (function (d) {
		r = d.getValue()+r;
	});
	return r;
};

function fromNumber (n, digits) {
	var r = [];

	if (n===undefined) {
		for (var i=0; i<digits; i++) {
			r.push(v());
		}		
	}
	else {
		while(n) {
			r.push(v({domain: [n&1]}));
			n = n >> 1;
		};

		for (var i=r.length; i<digits; i++) {
			r.push(v({domain: [0]}));
		}
	}
	
	return r;
};



var print = function (vars) {
	var s = "";
	vars.forEach (function (e) {
		s += e.getValue() + " ";
	});
	
	console.log(s);
};


function add_print (p, q, r) {
	var _p = toNumber(p);
	var _q = toNumber(q);
	var _r = toNumber(r);

	console.log("\ndecimal: " + _p + " + " + _q + " = " + _r);

	var _p = toBits(p);
	var _q = toBits(q);
	var _r = toBits(r);

	console.log("bits: " + _p + " + " + _q + " = " + _r);

};

var a = add(undefined, undefined, 9, 5, add_print); a();

function mul_print (p, q, r) {
	var _p = toNumber(p, true);
	var _q = toNumber(q, true);
	var _r = toNumber(r, true);

	console.log(_p + " * " + _q + " = " + _r);
};

var x = fromNumber(undefined, 3);
var raiz = MULn(x, x, fromNumber(16, 6), mul_print); raiz();

// Add3 
var digits = 5;
var a  = fromNumber(undefined, digits);
var b  = fromNumber(undefined, digits);
var r1 = fromNumber(undefined, digits);
var c  = fromNumber(undefined, digits);
var r  = fromNumber(10, digits);


var add3 = ADDn (a, b, r1, MULn(r1, c, r, function () {
	console.log("(" + toNumber(a) + " + " + toNumber(b) + ") * " + toNumber(c) + " = " + toNumber(r)); 
}));

add3();
