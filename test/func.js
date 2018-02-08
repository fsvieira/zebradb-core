"use strict";

const test = require("../lib/testing/test");

describe("Func tests.", () => {
	it("Custom function for print query.",
		test(
			`
            print: ('v) -> 'v.

            doit: ' -> "do it".

            (yellow)
            `, [{
					query: "?(yellow) | print",
					results: [
						"yellow"
					]
				},
				{
					query: "?(yellow) | doit",
					results: [
						"do it"
					]
				}
			]
		)
	);

	it("brother test.",
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

            mother:
                (mother (female 'mother) (female 'daughter) ') ->
                    "" 'daughter " is " 'mother " daughter.",

                (mother (female 'mother) (male 'son) ') ->
                    "" 'son " is " 'mother " son."
            .

            `, [{

				query: "?(mother ' ' ') | mother",
				results: [
					"filipe is noémia son.",
					"isabel is noémia daughter.",
					"joana is noémia daughter."
				]
			}]
		)
	);

});
