var v = require("../../lib/variable").v;

function add (c) {
	var a = v({domain: [0,1]});
	var b = v({domain: [0,1]});

	var r = v({domain: [0,1]}); // result
	
	c = c || v({value: 0}); // previews carry
	var nc = v({domain: [0,1]}); // next carry

	/*var _add = function (a, b, r, c, nc) {
		return function () {
			if ((c.getValue()!==undefined) && (a.getValue()!==undefined) && (b.getValue()!==undefined)) {
				var _r = a.getValue() + b.getValue() + c.getValue();

				r.setValue(_r&0x1);
				nc.setValue(_r>>1);
			}
		};
	}(a,b,r,c, nc);*/
	
	var _add = function (a, b, r, c, nc) {
		return function (v) {
			if (
				(a.getValue() !== undefined)
				&& (b.getValue() !== undefined)
				&& (c.getValue() !== undefined)
			) {
				var _r = a.getValue() + b.getValue() + c.getValue();

				r.setValue(_r&0x1);
				nc.setValue(_r>>1);
			}
			else if (
				(a.getValue() !== undefined)
				&& (b.getValue() !== undefined)
				// && (c.getValue() !== undefined)
				&& (r.getValue() !== undefined)
			) {
				var _r = a.getValue() + b.getValue() + r.getValue();
				
				r.setValue(_r&0x1);
				c.setValue(_r>>1);
			}
			else if (
				(a.getValue() !== undefined)
				// && (b.getValue() !== undefined)
				&& (c.getValue() !== undefined)
				&& (r.getValue() !== undefined)
			) {
				var _r = a.getValue() + b.getValue() + r.getValue();
				
				r.setValue(_r&0x1);
				b.setValue(_r>>1);
			}
			else if (
				// (a.getValue() !== undefined)
				(b.getValue() !== undefined)
				&& (c.getValue() !== undefined)
				&& (r.getValue() !== undefined)
			) {
				var _r = a.getValue() + b.getValue() + r.getValue();
				
				r.setValue(_r&0x1);
				a.setValue(_r>>1);
			}
			
		};
	}(a, b, r, c, nc);
	
	a.change (_add);
	b.change (_add);
	
	
	
	r.change(_add_r);
	c.change(_add_r);
	nc.change(_add_r);
	
	return {a: a, b: b,r: r, c: c, nc: nc};
	
};

function add_vars (n) {
	var v = add();
	var result = {a: [],b: [],r: []};
	
	result.a.push(v.a);
	result.b.push(v.b);
	result.r.push(v.r);
	
	for (var i=0; i<n; i++) {
		v = add(v.nc);
		result.a.push(v.a);
		result.b.push(v.b);
		result.r.push(v.r);
	}
	
	result.r.push(v.nc);
	
	return result;
};

function setNumber (number, vars) {
	vars.forEach (function (v, index) {
		v.setValue((number>>index) & 0x1);
	});
};

function toNumber (vars) {
	var result = 0;
	vars.forEach (function (v, index) {
		result |= v.getValue() << index;
	});
	
	return result;
};


var r = add_vars(4);

setNumber(7, r.a);
// setNumber(7, r.b);
setNumber(14, r.r);

// console.log(toNumber(r.r));
console.log(toNumber(r.b));


