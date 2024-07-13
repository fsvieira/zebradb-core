"use strict";

const test = require("../test-utils/test");

describe("Set Operations", () => {
	it("Subset (1)", test(
		`
			$SET_SUBSET = {
				('a subset 's) |
					|a| <= |'s|, 'e in 'a, 'e in 's
			}
		`,
		[
			{
				query: ``,
				results: [
					"@(2 = 1 + 1)" 
				]
			}
		], 
		{
			path: 'dbs/set-operations/subset-1', 
			timeout: 1000 * 60 * 60,
			log: true
		}
	));

	it("Subset (2)", test(
		`
			$SET_SUBSET = {
				('a subset 's) |
					|a| <= |'s|, 'a = {'e | 'e in 's}
			}
		`,
		[
			{
				query: ``,
				results: [
					"@(2 = 1 + 1)" 
				]
			}
		], 
		{
			path: 'dbs/set-operations/subset-2', 
			timeout: 1000 * 60 * 60,
			log: true
		}
	));

	it("Union", test(
		`
			$SET_UNION = {
				('u = 'a union 's) |
					'u = {'e | 'e in 'a ; 'e in 's}
			}
		`,
		[
			{
				query: ``,
				results: [
					"@(2 = 1 + 1)" 
				]
			}
		], 
		{
			path: 'dbs/set-operations/union', 
			timeout: 1000 * 60 * 60,
			log: true
		}
	));

	it("Intersection", test(
		`
			$SET_INSERSECTION = {
				('i = 'a intersection 's) |
					'i = {'e | 'e in 'a , 'e in 's}
			}
		`,
		[
			{
				query: ``,
				results: [
					"@(2 = 1 + 1)" 
				]
			}
		], 
		{
			path: 'dbs/set-operations/intersection', 
			timeout: 1000 * 60 * 60,
			log: true
		}
	));

	it("EQUAL", test(
		`
			$SET_SUBSET = {
				('a subset 's) |
					|a| <= |'s|, 'a = {'e | 'e in 's}
			}

			$SET_EQUAL = {
				('a = 'b) |
					('a subset 'b):$SET_SUBSET, ('b subset 'a):$SET_SUBSET
			}
		`,
		[
			{
				query: ``,
				results: [
					"@(2 = 1 + 1)" 
				]
			}
		], 
		{
			path: 'dbs/set-operations/equal-1', 
			timeout: 1000 * 60 * 60,
			log: true
		}
	));

	it("NOT_EQUAL", test(
		`
			$SET_NOT_EQUAL = {
				('a != 'b) |
					['ae in 'a and 'ae not-in 'b] or
					['be in 'b and 'be not-in 'a]  
			}
		`,
		[
			{
				query: ``,
				results: [
					"@(2 = 1 + 1)" 
				]
			}
		], 
		{
			path: 'dbs/set-operations/not-equal-1', 
			timeout: 1000 * 60 * 60,
			log: true
		}
	));

});


