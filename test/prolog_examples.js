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
					query: "(mary likes food)",
					results: ["@(mary likes food)"]
				},
				{
					query: "(john likes wine)",
					results: ["@(john likes wine)"]
				},
				{
					query: "(john likes food)",
					results: []
				},
				{
					query: "(mary likes 'stuff)",
					results: [
						"@(mary likes food)",
      					"@(mary likes wine)"
					]
				}
			],
            {
                timeout: 1000 * 60 * 5,
				path: 'dbs/prolog/1.db'
			}
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
				query: "(john likes 'stuff 'p)",
				results: [
					"@(john likes food @(mary likes food 'v$5::_v1))",
					"@(john likes wine @(mary likes wine 'v$5::_v1))"
				]}
			],
            {
                timeout: 1000 * 60 * 5,
				path: 'dbs/prolog/2.db'
			}
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

				query: "(john likes 'stuff 'p)",
				results: []
			}],
            {
                timeout: 1000 * 60 * 5,
				path: 'dbs/prolog/3.db'
			}
		)
	);

	it("Should query what john likes, he likes anyone who likes wine.",
		test(
			`(mary likes wine ') # likes(mary,wine).
			(john likes wine ') # likes(john,wine).

			# 2. John likes anyone who likes wine
			(john likes 'person ('person likes wine '))`, 
			[{
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

				query: "(john likes 'stuff 'p)",
				results: [
					"@(john likes john @(john likes wine 'v$5::_v1))",
					"@(john likes mary @(mary likes wine 'v$5::_v1))",
					"@(john likes wine 'p)"
				]
			}],
            {
                timeout: 1000 * 60 * 5,
				path: 'dbs/prolog/4.db'
			}
		)
	);

	it("Should query what john likes," +
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
				query: "(john likes 'stuff 'p)",
				results: [
					"@(john likes food @(mary likes food 'v$5::_v1))",
					"@(john likes john @(john likes wine 'v$5::_v1))",
					"@(john likes john @(john likes wine @(mary likes wine 'v$9::_v1)))",
					"@(john likes mary 'p)",
					"@(john likes mary @(mary likes wine 'v$5::_v1))",
					"@(john likes wine 'p)",
					"@(john likes wine @(mary likes wine 'v$5::_v1))"
				]
			}],
            {
                timeout: 1000 * 60 * 5,
				path: 'dbs/prolog/5.db'
			}
		)
	);

	it("Should query john likes people that like themselves.",
		test(
			`(john likes wine ' ') # likes(john,wine).

			# 1. John likes anyone who likes wine
			(john likes 'person ('person likes wine ' ') ')

			(mary likes mary ' ')

			# 2. John likes anyone who likes themselves
			# "(john likes 'person ('person likes 'person ' ') ')"
			# this is recursive by itself.
			# john can't like himself just because it likes himself.
			(john likes 'person ('person likes 'person 'p ')
                ('person != john)
            )
			('x != ~'x)
			`, [{
				query: "(john likes 'stuff 'p ')",
				results: [
					"@(john likes john @(john likes wine 'v$6::_v1 'v$7::_v2) '_v1)",
					"@(john likes mary @(mary likes mary 'v$6::p 'v$7::_v1) @(mary != john))",
					"@(john likes wine 'p '_v1)"
				]
			}],
            {
                timeout: 1000 * 60 * 5,
				path: 'dbs/prolog/6.db'
			}
		)
	);

	it("Should query people about what they like (Extended).",
		test(
			`(mary likes food ' ')  # likes(mary,food).
			(mary likes wine ' ')   # likes(mary,wine).
			(john likes wine ' ')   # likes(john,wine).
			(john likes mary ' ')   # likes(john,mary).
			(peter likes peter ' ') # likes(peter,peter).

			# 1. John likes anything that Mary likes
			(john likes 'stuff (mary likes 'stuff ' ') ')

			# 2. John likes anyone who likes wine
			(john likes 'person ('person likes wine ' ') ')

			# 3. John likes anyone who likes themselves
			# "(john likes 'person ('person likes 'person '))"
			# this is recursive by itself.
			# john can't like himself just because it likes himself.
			(john likes 'person ('person likes 'person ' ')
				('person != john)
            )
            ('x != ~'x)`, [{
				query: "(john likes 'stuff ' ')",
				results: [
					"@(john likes food @(mary likes food 'v$6::_v1 'v$7::_v2) '_v2)",
					"@(john likes john @(john likes wine 'v$6::_v1 'v$7::_v2) '_v2)",
					"@(john likes john @(john likes wine @(mary likes wine 'v$12::_v1 'v$13::_v2) 'v$7::_v2) '_v2)",
					"@(john likes mary '_v1 '_v2)",
					"@(john likes mary @(mary likes wine 'v$6::_v1 'v$7::_v2) '_v2)",
					"@(john likes peter @(peter likes peter 'v$6::_v1 'v$7::_v2) @(peter != john))",
					"@(john likes wine '_v1 '_v2)",
					"@(john likes wine @(mary likes wine 'v$6::_v1 'v$7::_v2) '_v2)"
				]
			}],
            {
                timeout: 1000 * 60 * 5,
				path: 'dbs/prolog/7.db'
			}
		)
	);

	it("Should give no results to circular definition.",
		test(
			// Query is not able to stop on their own.
			"(john likes 'person ('person likes 'person '))", [{
				query: "(john likes 'stuff 'p)",
				results: []
			}], { 
				depth: 7,
                timeout: 30000,
				path: 'dbs/prolog/8.db'
			}
		)
	);
});
