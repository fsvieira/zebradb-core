"use strict";

const test = require("../test-utils/test");

describe("Func tests.", () => {
	it("Custom function for print query.",
		test(
			`
            (yellow)
            `, [{
					query: "(yellow)",
					process: ({t: [v]}) => v.c,
					results: [
						"yellow"
					]
				},
				{
					query: "(yellow)",
					process: r => "do it",
					results: [
						"do it"
					]
				}
			]
		)
	);

	/*
	const ztl = new ZTL();
	ztl.compile(`
		mother:
			(mother (female 'mother) (female 'daughter) ') ->
				"" 'daughter " is " 'mother " daughter.",

			(mother (female 'mother) (male 'son) ') ->
				"" 'son " is " 'mother " son."
		.
	`);*/

	const sentence = ({
		t: [
			{c: parentGender}, 
			{
				t: [
					_a, 
					{c: parent}
				]
			},
			{
				t: [
					{c: childGender},
					{c: child}
				]
			}
		]
	}) => `${child} is ${parent} ${childGender==='male'?"son":"daughter"}.`;

	it("family test.",
		test(
			`(male rolando)
            (female noémia)

            (female joana)
            (female isabel)
            (male filipe)

            (parent (female noémia) (female joana))
            (parent (female noémia) (female isabel))
            (parent (female noémia) (male filipe))

            (parent (male rolando) (female joana))
            (parent (male rolando) (female isabel))
            (parent (male rolando) (male filipe))

            (father (male 'x) ('y 'z) (parent (male 'x) ('y 'z)))
            (mother (female 'x) ('y 'z) (parent (female 'x) ('y 'z)))
			`, [
				{
					query: "(mother ' ' ')",
					process: sentence,
					results: [
						"filipe is noémia son.",
						"isabel is noémia daughter.",
						"joana is noémia daughter."
					]
				},
				{
					query: "(father ' ' ')",
					process: sentence,
					results: [
						"filipe is rolando son.",
						"isabel is rolando daughter.",
						"joana is rolando daughter."
					]
				}
			],
            {
                timeout: 1000 * 60
			}
		)
	);

});
