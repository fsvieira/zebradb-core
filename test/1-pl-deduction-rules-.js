"use strict";

const test = require("../test-utils/test");

/*

    Modus Ponens (MP): If pp implies qq and pp is true, then qq is true.
    (p→q), p⊢q(p→q),p⊢q

    Modus Tollens (MT): If pp implies qq and qq is false, then pp is false.
    (p→q), ¬q⊢¬p(p→q),¬q⊢¬p

    Hypothetical Syllogism (HS): If pp implies qq, and qq implies rr, then pp implies rr.
    (p→q), (q→r)⊢(p→r)(p→q),(q→r)⊢(p→r)

    Disjunctive Syllogism (DS): If pp or qq is true, and pp is false, then qq is true.
    (p∨q), ¬p⊢q(p∨q),¬p⊢q

    Conjunction (Conj): If both pp and qq are true, then p∧qp∧q is true.
    p, q⊢(p∧q)p,q⊢(p∧q)

    Simplification (Simp): If p∧qp∧q is true, then pp is true.
    (p∧q)⊢p(p∧q)⊢p

    Addition (Add): If pp is true, then p∨qp∨q is true.
    p⊢(p∨q)p⊢(p∨q)
*/

describe("Propositional Logic Deduction Rules", () => {
	it("Modus Ponens (MP): If pp implies qq and pp is true, then qq is true.", test(
		`
			$IMP = {('p -> 'q) ...};

			$EQUAL = {('p = 'p) ...}

			$DEDUCTION_IMP = {
				({'p ('p -> 'q):$IMP} :- {'q}) 
				... 
			}

			$DEDUCTION_ID = {
				({'p} :- {'p})
				...
			}

			$DEDUCTION_RULES = $DEDUCTION_IMP 
				union $DEDUCTION_ID

			$DEDUCTION = {
				('f :- 'd:$DEDUCTION) | 
					[
						'f != 'd,
						's subset 'f,
						('s :- 's1) in $DEDUCTION RULES,
						'd1 = ['f difference 's] union 's1,
						('d1 :- 'd):$DEDUCTION
					]
					or 'f = 'd
			}

			$FORMULA = {
				('vs:$EQUAL 'f:$DEDUCTION)
			}
		`,
		[
			{
				query: `{ {} ({'p ('p -> 'q)} :- 'd):$FORMULA ...}`,
				results: [
					"@(2 = 1 + 1)" 
				]
			},
			{
				query: `{
					(
						{('p = «Its raining») ('q = «Streets are wet»)}
						({'p ('p -> 'q)} :- 'd)
					):$FORMULA ...
				}`,
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


