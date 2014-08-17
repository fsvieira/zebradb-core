function partition (init, size, test) {
	init = shuffle(init.slice(0));

	var pool = [];
	while (init.length > 0) {
		var gene = init.splice(0, size);
		pool.push({score: test(gene), gene: gene});
	}
	
	// check last one:
	var last = pool.pop();
	var c = size-last.gene.length;
	 
	for (var i=0; i<c; i++) {
		last.gene.push(pool[0].gene[i]);
	};

	last.score = test(last.gene); 
	pool.push(last);
	 
	return pool;
};

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};


function maximize (remainder, clues, test, size, score) {
	if (clues.length === size) {
		var r = {
			gene: clues,
			score: test(clues)
		};
		console.log("gene score: " + r.score.count + " --- " + score);
		return r;
	}
	
	// remainder.forEach (function (clue, index) {
	for (var index=0; index< remainder.length; index++) {
		var clue = remainder[index];
		var c = clues.slice(0);
		
		c.push(clue);

		var gene_r = maximize(remainder.slice(index+1), c, test, size, score);
		if (gene_r && gene_r.score.count >= score) {
			return gene_r;
		}
	} // );
};

/*
function maximize (remainder, clues, test, size, score) {
	if (clues.length === size) {
		var r = {
			gene: clues,
			score: test(clues)
		};
		console.log("gene score: " + r.score.count + " --- " + score);
		return r;
	}
	
	var gene = {score: -1};
	
	// 
	for (var index=0; index< remainder.length; index++) {
		var clue = remainder[index];
		var c = clues.slice(0);
		
		c.push(clue);

		var gene_r = maximize(remainder.slice(index+1), c, test, size, score);
		if (gene_r && gene_r.score.count > gene.score) {
			gene = gene_r;
		}
	};
	
	return gene;
};
*/

/*
function maximize (remainder, clues, test, size, score) {
	if (clues.length === size) {
		var r = {
			score: test(clues),
			gene: clues 
		};

		console.log("gene score " + r.score.count + "% --> " + score);

		if (r.score.count >= score) {
			return r; // candidate found
		}
	}
	else {
		var result = [];
		remainder.forEach (function (clue, index) {
			var c = clues.slice(0);
			
			c.push(clue);

			result.push({
				score: test(c),
				clues: c,
				remainder: remainder.slice(index+1)
			});
		});

		// shuffle(result);
		result.sort(function (a, b) {
			return b.score.count-a.score.count;
		});
		
		for (var i=0; i < result.length; i++) {
			var r = result[i];
			var gene = maximize (r.remainder, r.clues, test, size, score);
			if (gene) {
				return gene;
			}
		};
	}
	
};
*/

function crossover (gene1, gene2, test, size, index, l) {
	if (index < 3) { 
		// Maximize only first gene, 
		var all = gene1.gene.slice(0);
		gene2.gene.forEach (function (g) {
			all.push(g);
		});
		var g = maximize(all, [], test, size, gene1.score.count);
		gene1.score = g.score;
		gene1.gene = g.gene;
		
		gene2.gene = all;
		
		gene1.gene.forEach (function (g) {
			gene2.gene.splice(gene2.gene.indexOf(g),1);
		});
		
		gene2.score = test(gene2.gene);
	}
	else {
		shuffle (gene1.gene);
		shuffle (gene2.gene);
		
		gene1.gene.forEach (function (g, index) {
			var coin = Math.random();
			var perc = gene1.score.count / (gene1.score.count + gene2.score.count);	
			if (coin <= perc) {
				gene1.gene[index] = gene2.gene[index];
				gene2.gene[index] = g;
			}
		});
		
		gene1.score = test(gene1.gene);
		gene2.score = test(gene2.gene);
	}
}

function crossover_t (gene1, gene2, test, size, index) {
	/*shuffle (gene1.gene);
	shuffle (gene2.gene);
			
	var perc = gene1.score.count / (gene1.score.count + gene2.score.count);
			
	gene1.gene.forEach (function (g, index) {
		var coin = Math.random();
			
		if (coin <= perc) {
			gene1.gene[index] = gene2.gene[index];
			gene2.gene[index] = g;
		}
	});*/
	
	// var max = gene1.score.count;
	// var count = 10000;
	
	// do {
		shuffle (gene1.gene);
		shuffle (gene2.gene);
		
		gene1.gene.forEach (function (g, index) {
			var coin = Math.random();
			var perc = gene1.score.count / (gene1.score.count + gene2.score.count);	
			if (coin <= perc) {
				gene1.gene[index] = gene2.gene[index];
				gene2.gene[index] = g;
			}
		});
		
		gene1.score = test(gene1.gene);
		gene2.score = test(gene2.gene);
	/*
		count--;
		
		if (gene1.score.count<max) {
			max = gene1.score.count;
		}
		
		if ((count < 0) && (gene1.score.count >= max)) {
			// console.log("No max found");
			return;
		}
		
	} while (gene1.score.count >= max);
	*/
	
};

function find (mol, size, test, max, saveClues, saveDebug) {
	// var results = [];
	var results = 0;
	
	/*var dup = mol.slice(0);
	mol.forEach (function (m) {
		dup.push(m);
		// dup.push(m);
	});
	
	shuffle (dup);
	var s = Math.floor(dup.length/size)*size;
	
	dup.splice(s, dup.length - s);
	
	var pool = partition(dup, size, test);
	*/
	var pool = partition(mol, size, test);
	
	function check (gene, index) {
		if (gene.score.sol) {
			results++;
			pool.splice(index, 1);
			saveClues(gene.gene);
		}

		if (gene.score.debug) {
			saveDebug(gene.gene);
		}
	};

	while (results < max) {
		pool.sort(function (a, b) {
			return b.score.count - a.score.count;
		});

		console.log(pool[0].score.count + " %");
		console.log(pool[1].score.count + " % -- 2");

		for (var i=0; i<pool.length-1; i++) {
			for (var j=i+1; j<pool.length; j++) {
				crossover (pool[i], pool[j], test, size, i, pool.length);
				check(pool[i], i);
				check(pool[j], j);
			}
		}
		
		/*
		for (var i=0; i<size; i++) {
			for (var j=i+1; j<pool.length; j++) {
				crossover (pool[i], pool[j], test, size, i, pool.length);
				check(pool[i], i);
				check(pool[j], j);
			}
		}
		
		for (var i=Math.floor(size/2); i<pool.length-1; i++) {
			crossover (pool[i], pool[i+1], test, size, size, pool.length);
			check(pool[i], i);
			check(pool[i+1], i+1);
		}
		*/
	}
	
	return results;
};

exports.find = find;
