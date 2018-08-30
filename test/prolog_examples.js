"use strict";

const test = require("../test-utils/test");

/*
  Online prolog examples converted to zebra system.
*/
describe("Prolog examples port Tests.", () => {
	it("Should query people about what they like.",
		test(
			`(mary likes food)
            (mary likes wine)
            (john likes wine)
            (john likes mary)`, [
				{
					query: "?(mary likes food)",
					results: ["@(mary likes food)"]
				},
				{
					query: "?(john likes wine)",
					results: ["@(john likes wine)"]
				},
				{
					query: "?(john likes food)",
					results: []
				},
				{
					query: "?(mary likes 'stuff)",
					results: [
						"@(mary likes {{v$51 : food wine}})"
					]
				}
			]
		)
	);

	it("Should query about what john likes.",
		test(
			// 1. John likes anything that Mary likes
			`
			(mary likes food ')
            (mary likes wine ')
            (john likes 'stuff (mary likes 'stuff '))
            `, [{
				query: "?(john likes 'stuff 'p)",
				results: [
					"@(john likes {{v$58 : food wine}} @(mary likes {{v$58 : food wine}} '))"
				]
			}]
		)
	);

	it("Should fail on insufficient definitions.",
		test(
			"(john likes 'person ('person likes wine '))", [{
				// (john likes 'stuff 'p).
				//    (john likes 'person ('person likes wine '))
				// (john likes 'stuff='person 'p=('person likes wine '))
				// ('person likes wine ').
				//    (john likes 'person ('person likes wine ')
				// ('person=john likes 'person2=wine
				//    ('person2=wine likes wine '))
				// ('person2=wine likes wine ').
				//    (john likes 'person ('person likes wine '))
				// wine != john -> fail.

				query: "?(john likes 'stuff 'p)",
				results: []
			}]
		)
	);

	it("Should query what john likes, he likes anyone who likes wine.",
		test(
			`(mary likes wine ') # likes(mary,wine).
			(john likes wine ') # likes(john,wine).

			# 2. John likes anyone who likes wine
			(john likes 'person ('person likes wine '))`, [{
				// (john likes 'stuff 'p) . (john likes 'person
				//        ('person likes wine '))
				// =>   stuff = person
				//      p = (person likes wine ')
				// (person likes wine ') .
				//		(mary likes wine ') => person = mary
				// (person likes wine ') .
				//		(john likes wine ') => person = john
				// (person1 likes wine ') .
				//    (john likes 'person2 ('person2 likes wine '))
				// =>   person1 = john, person2 = wine
				//      (wine likes wine ') FAIL.

				query: "?(john likes 'stuff 'p)",
				results: [
					/* TODO: 
					"@(john likes wine ')",
					"@(john likes {{v$61 : john mary}} @({{v$61 : john mary}} likes wine '))"
					*/
					"@(john likes john @(john likes wine '))",
					"@(john likes mary @(mary likes wine '))",
					"@(john likes wine ')"
				]
			}]
		)
	);

	// (john likes wine (john likes wine (wine likes wine ')))) !fail,
	// 
	// - ('person likes wine ') -> (john likes wine (wine likes wine ')) !fail,
	// TODO: unification is failing ??
	// @(john likes wine ('person likes wine ')) => should be @(john likes wine ('person likes wine '))
	xit("Should query what john likes," +
		"he likes what mary likes and people that like wine.",
		test(
			`(mary likes food ') # likes(mary,food).
			(mary likes wine ') # likes(mary,wine).
			(john likes wine ') # likes(john,wine).
			(john likes mary ') # likes(john,mary).

			# 1. John likes anything that Mary likes
			(john likes 'stuff (mary likes 'stuff '))

			# 2. John likes anyone who likes wine
			(john likes 'person ('person likes wine '))`, [{
				query: "?(john likes 'stuff 'p)",
				results: [
					"@(john likes mary ')",

					// TODO: the next one is repeated on this: "@(john likes {{v$115 : john mary}} @({{v$115 : john mary}} likes wine '))",
					"@(john likes mary @(mary likes wine '))", 
					"@(john likes wine ')",
					
					// TODO: the next one is repeated on this: "@(john likes {{v$115 : john mary}} @({{v$115 : john mary}} likes wine '))",
					"@(john likes wine @(mary likes wine '))", 
					"@(john likes {{v$107 : food wine}} @(mary likes {{v$107 : food wine}} '))",
					"@(john likes {{v$115 : john mary}} @({{v$115 : john mary}} likes wine '))",

					// TODO: this is strange, probably a bug, when replacing domain with mary -> (mary likes wine (mary likes wine)) 
					"@(john likes {{v$115 : john mary}} @({{v$115 : john mary}} likes wine @(mary likes wine ')))"

					// DUPLICATE HAPPENING
				]
			}]
		)
	);

	it("Should query john likes people that like themselves.",
		test(
			`(john likes wine ') # likes(john,wine).

			# 1. John likes anyone who likes wine
			(john likes 'person ('person likes wine '))

			(mary likes mary ')

			# 2. John likes anyone who likes themselves
			# "(john likes 'person ('person likes 'person '))"
			# this is recursive by itself.
			# john can't like himself just because it likes himself.
			(john likes 'person ('person likes 'person 'p)
                ^(equal 'person john)
            )
			(equal 'x 'x)
			`, [{
				query: "?(john likes 'stuff 'p)",
				results: [
					"@(john likes john @(john likes wine '))",
      				"@(john likes mary @(mary likes mary '))[^!(equal mary john)]",
	   				"@(john likes wine ')"
				]
			}]
		)
	);

	xit("Should query people about what they like (Extended).",
		test(
			`(mary likes food ')  # likes(mary,food).
			(mary likes wine ')   # likes(mary,wine).
			(john likes wine ')   # likes(john,wine).
			(john likes mary ')   # likes(john,mary).
			(peter likes peter ') # likes(peter,peter).

			# 1. John likes anything that Mary likes
			(john likes 'stuff (mary likes 'stuff '))

			# 2. John likes anyone who likes wine
			(john likes 'person ('person likes wine '))

			# 3. John likes anyone who likes themselves
			# "(john likes 'person ('person likes 'person '))"
			# this is recursive by itself.
			# john can't like himself just because it likes himself.
			(john likes 'person ('person likes 'person ')
                ^(equal 'person john)
            )
            (equal 'x 'x)`, [{
				query: "?(john likes 'stuff ')",
				results: [
					"@(john likes john @(john likes wine '))",
					"@(john likes john @(john likes wine @(mary likes wine ')))", 
					"@(john likes mary @(mary likes wine '))", 
					"@(john likes peter @(peter likes peter '))[^!(equal peter john)]",
					"@(john likes {{v$98 : food wine}} @(mary likes {{v$98 : food wine}} '))",
					"@(john likes {{v$98 : mary wine}} ')", 
					"@(john likes {{v$98 : mary wine}} @(mary likes wine '))"
				]
			}]
		)
	);

	it("Should give no results to circular definition.",
		test(
			// Query is not able to stop on their own.
			"(john likes 'person ('person likes 'person '))", [{
				query: "?(john likes 'stuff 'p)",
				results: []
			}], { depth: 7 }
		)
	);
});
