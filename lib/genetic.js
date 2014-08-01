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

function crossover (gene1, gene2, test, size, index) {
	shuffle (gene1.gene);
	shuffle (gene2.gene);
			
	var perc = gene1.score.count / (gene1.score.count + gene2.score.count);
			
	gene1.gene.forEach (function (g, index) {
		var coin = Math.random();
			
		if (coin <= perc) {
			gene1.gene[index] = gene2.gene[index];
			gene2.gene[index] = g;
		}
	});
		
	gene1.score = test(gene1.gene);
	gene2.score = test(gene2.gene);
};

function find (mol, size, test, max, saveClues) {
	// var results = [];
	var results = 0;
	var pool = partition(mol, size, test);
	
	function check (gene, index) {
		if (gene.score.sol) {
			results++;
			pool.splice(index, 1);
			saveClues(gene.gene);
		}
	};
	
	while (results < max) {
		pool.sort(function (a, b) {
			a.score.count - b.score.count;
		});
		
		for (var i=0; i<pool.length-1; i++) {
			crossover (pool[i], pool[i+1], test, size, i);
			check(pool[i], i);
			check(pool[i+1], i+1);
		}
	}
	
	return results;
};

exports.find = find;
