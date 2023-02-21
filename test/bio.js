"use strict";

const test = require("../test-utils/test");

/*A stands for Adenine.
C stands for Cytosine.
G stands for Guanine.
T stands for Thymine (in DNA) or Uracil (in RNA).
*/

describe("Bio Tests", () => {
    it("DNA/RNA Bases",
            test(
            `
                (DNA-BASE A Adenine)
                (DNA-BASE C Cytosine)
                (DNA-BASE G Guanine)
                (DNA-BASE T Thymine)

                (RNA-BASE A Adenine)
                (RNA-BASE C Cytosine)
                (RNA-BASE G Guanine)
                (RNA-BASE T Uracil)
            `, [{
                query: `(DNA-BASE ' ')`,
                results: [
                    '@(DNA-BASE A Adenine)',
                    '@(DNA-BASE C Cytosine)',
                    '@(DNA-BASE G Guanine)',
                    '@(DNA-BASE T Thymine)'
                ]
            }],
            {path: 'dbs/bio/1', timeout: 2000 * 30}
        )
    );

    it("DNA Sequence",
		test(
			`
                (DNA-BASE A Adenine)
                (DNA-BASE C Cytosine)
                (DNA-BASE G Guanine)
                (DNA-BASE T Thymine)

                (RNA-BASE A Adenine)
                (RNA-BASE C Cytosine)
                (RNA-BASE G Guanine)
                (RNA-BASE T Uracil)
            
                (DNA (DNA-BASE 'l 'name) (DNA ' '))
                (DNA (DNA-BASE 'l 'name) (DNA '))
                (DNA (DNA-BASE 'l 'name) )
            `, [{
				query: "(DNA (DNA-BASE ' '))",
				results: [
                    "@(DNA @(DNA-BASE A Adenine))",
                    "@(DNA @(DNA-BASE C Cytosine))",
                    "@(DNA @(DNA-BASE G Guanine))",
                    "@(DNA @(DNA-BASE T Thymine))"
                ],
                query: "(DNA ' (DNA '))",
				results: [
                    '@(DNA @(DNA-BASE A Adenine) @(DNA @(DNA-BASE A Adenine)))',
                    '@(DNA @(DNA-BASE A Adenine) @(DNA @(DNA-BASE C Cytosine)))',
                    '@(DNA @(DNA-BASE A Adenine) @(DNA @(DNA-BASE G Guanine)))',
                    '@(DNA @(DNA-BASE A Adenine) @(DNA @(DNA-BASE T Thymine)))',
                    '@(DNA @(DNA-BASE C Cytosine) @(DNA @(DNA-BASE A Adenine)))',
                    '@(DNA @(DNA-BASE C Cytosine) @(DNA @(DNA-BASE C Cytosine)))',
                    '@(DNA @(DNA-BASE C Cytosine) @(DNA @(DNA-BASE G Guanine)))',
                    '@(DNA @(DNA-BASE C Cytosine) @(DNA @(DNA-BASE T Thymine)))',
                    '@(DNA @(DNA-BASE G Guanine) @(DNA @(DNA-BASE A Adenine)))',
                    '@(DNA @(DNA-BASE G Guanine) @(DNA @(DNA-BASE C Cytosine)))',
                    '@(DNA @(DNA-BASE G Guanine) @(DNA @(DNA-BASE G Guanine)))',
                    '@(DNA @(DNA-BASE G Guanine) @(DNA @(DNA-BASE T Thymine)))',
                    '@(DNA @(DNA-BASE T Thymine) @(DNA @(DNA-BASE A Adenine)))',
                    '@(DNA @(DNA-BASE T Thymine) @(DNA @(DNA-BASE C Cytosine)))',
                    '@(DNA @(DNA-BASE T Thymine) @(DNA @(DNA-BASE G Guanine)))',
                    '@(DNA @(DNA-BASE T Thymine) @(DNA @(DNA-BASE T Thymine)))'
                ]
			}],
			{path: 'dbs/bio/2'}
		)
	);

    it("Helicases",
		test(
			`
                (DNA-BASE A Adenine)
                (DNA-BASE C Cytosine)
                (DNA-BASE G Guanine)
                (DNA-BASE T Thymine)

                (RNA-BASE A Adenine)
                (RNA-BASE C Cytosine)
                (RNA-BASE G Guanine)
                (RNA-BASE T Uracil)
            
                (DNA (DNA-BASE 'l 'name) (DNA ' '))
                (DNA (DNA-BASE 'l 'name) (DNA '))
                (DNA (DNA-BASE 'l 'name) )

                (Helicase-bind (DNA '))
                (Helicase-bind (DNA ' '))
            `, [{
				query: "(Helicase-bind (DNA ' (DNA ')))",
				results: [
                    '@(Helicase-bind @(DNA @(DNA-BASE A Adenine) @(DNA @(DNA-BASE A Adenine))))',
                    '@(Helicase-bind @(DNA @(DNA-BASE A Adenine) @(DNA @(DNA-BASE C Cytosine))))',
                    '@(Helicase-bind @(DNA @(DNA-BASE A Adenine) @(DNA @(DNA-BASE G Guanine))))',
                    '@(Helicase-bind @(DNA @(DNA-BASE A Adenine) @(DNA @(DNA-BASE T Thymine))))',
                    '@(Helicase-bind @(DNA @(DNA-BASE C Cytosine) @(DNA @(DNA-BASE A Adenine))))',
                    '@(Helicase-bind @(DNA @(DNA-BASE C Cytosine) @(DNA @(DNA-BASE C Cytosine))))',
                    '@(Helicase-bind @(DNA @(DNA-BASE C Cytosine) @(DNA @(DNA-BASE G Guanine))))',
                    '@(Helicase-bind @(DNA @(DNA-BASE C Cytosine) @(DNA @(DNA-BASE T Thymine))))',
                    '@(Helicase-bind @(DNA @(DNA-BASE G Guanine) @(DNA @(DNA-BASE A Adenine))))',
                    '@(Helicase-bind @(DNA @(DNA-BASE G Guanine) @(DNA @(DNA-BASE C Cytosine))))',
                    '@(Helicase-bind @(DNA @(DNA-BASE G Guanine) @(DNA @(DNA-BASE G Guanine))))',
                    '@(Helicase-bind @(DNA @(DNA-BASE G Guanine) @(DNA @(DNA-BASE T Thymine))))',
                    '@(Helicase-bind @(DNA @(DNA-BASE T Thymine) @(DNA @(DNA-BASE A Adenine))))',
                    '@(Helicase-bind @(DNA @(DNA-BASE T Thymine) @(DNA @(DNA-BASE C Cytosine))))',
                    '@(Helicase-bind @(DNA @(DNA-BASE T Thymine) @(DNA @(DNA-BASE G Guanine))))',
                    '@(Helicase-bind @(DNA @(DNA-BASE T Thymine) @(DNA @(DNA-BASE T Thymine))))'
                ],
			}],
			{path: 'dbs/bio/3'}
		)
        /*
            Once replication has ended, the original DNA strand remains intact and is used as a template for further rounds of replication. The newly synthesized strands are also joined together by the enzyme ligase to form a continuous strand.

            - return: It would return a pair of strings, where the first string is the template strand where replication will begin, and the second string is the newly synthesized strand.
        */
	);

    it("Quarks",
		test(
            /*
                Up quark: Flavor = "up", Electric charge = +2/3
                Down quark: Flavor = "down", Electric charge = -1/3
                Charm quark: Flavor = "charm", Electric charge = +2/3
                Strange quark: Flavor = "strange", Electric charge = -1/3
                Top quark: Flavor = "top", Electric charge = +2/3
                Bottom quark: Flavor = "bottom", Electric charge = -1/3
            */
            `
            (QUARK-FLAVOR up +2/3)
            (QUARK-FLAVOR down -1/3)
            (QUARK-FLAVOR charm +2/3)
            (QUARK-FLAVOR strange -1/3)
            (QUARK-FLAVOR top +2/3)
            (QUARK-FLAVOR bottom -1/3)

            (QUARK-COLOR red)
            (QUARK-COLOR green)
            (QUARK-COLOR blue)

            (QUARK (QUARK-FLAVOR 'flavor 'charge) (QUARK-COLOR 'color) 'charge)
            
            (PROTON 
                (QUARK (QUARK-FLAVOR up 'charge1) (QUARK-COLOR ') 'charge1)
                (QUARK (QUARK-FLAVOR up 'charge2) (QUARK-COLOR ') 'charge2)
                (QUARK (QUARK-FLAVOR down 'charge3) (QUARK-COLOR ') 'charge3)
                +1
            )

            (NEUTRON 
                (QUARK (QUARK-FLAVOR up 'charge1) (QUARK-COLOR ') 'charge1)
                (QUARK (QUARK-FLAVOR down 'charge2) (QUARK-COLOR ') 'charge2)
                (QUARK (QUARK-FLAVOR down 'charge3) (QUARK-COLOR ') 'charge3)
                0
            )
            `, [
                {
                    query: "(QUARK ' ' ')",
                    results: [
                        '@(QUARK @(QUARK-FLAVOR bottom -1/3) @(QUARK-COLOR blue) -1/3)',
                        '@(QUARK @(QUARK-FLAVOR bottom -1/3) @(QUARK-COLOR green) -1/3)',
                        '@(QUARK @(QUARK-FLAVOR bottom -1/3) @(QUARK-COLOR red) -1/3)',
                        '@(QUARK @(QUARK-FLAVOR charm +2/3) @(QUARK-COLOR blue) +2/3)',
                        '@(QUARK @(QUARK-FLAVOR charm +2/3) @(QUARK-COLOR green) +2/3)',
                        '@(QUARK @(QUARK-FLAVOR charm +2/3) @(QUARK-COLOR red) +2/3)',
                        '@(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3)',
                        '@(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3)',
                        '@(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3)',
                        '@(QUARK @(QUARK-FLAVOR strange -1/3) @(QUARK-COLOR blue) -1/3)',
                        '@(QUARK @(QUARK-FLAVOR strange -1/3) @(QUARK-COLOR green) -1/3)',
                        '@(QUARK @(QUARK-FLAVOR strange -1/3) @(QUARK-COLOR red) -1/3)',
                        '@(QUARK @(QUARK-FLAVOR top +2/3) @(QUARK-COLOR blue) +2/3)',
                        '@(QUARK @(QUARK-FLAVOR top +2/3) @(QUARK-COLOR green) +2/3)',
                        '@(QUARK @(QUARK-FLAVOR top +2/3) @(QUARK-COLOR red) +2/3)',
                        '@(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3)',
                        '@(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3)',
                        '@(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3)'
                    ]
                },
                {
                    query: "(PROTON ' ' ' ')",
                    results: [
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) +1)',
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) +1)',
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) +1)',
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) +1)',
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) +1)',
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) +1)',
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) +1)',
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) +1)',
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) +1)',
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) +1)',
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) +1)',
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) +1)',
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) +1)',
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) +1)',
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) +1)',
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) +1)',
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) +1)',
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) +1)',
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) +1)',
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) +1)',
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) +1)',
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) +1)',
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) +1)',
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) +1)',
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) +1)',
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) +1)',
                        '@(PROTON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) +1)'
                    ]
                },
                {
                    query: "(NEUTRON ' ' ' ')",
                    results: [
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) 0)',
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) 0)',
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) 0)',
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) 0)',
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) 0)',
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) 0)',
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) 0)',
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) 0)',
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR blue) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) 0)',
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) 0)',
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) 0)',
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) 0)',
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) 0)',
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) 0)',
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) 0)',
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) 0)',
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) 0)',
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR green) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) 0)',
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) 0)',
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) 0)',
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) 0)',
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) 0)',
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) 0)',
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) 0)',
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR blue) -1/3) 0)',
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR green) -1/3) 0)',
                        '@(NEUTRON @(QUARK @(QUARK-FLAVOR up +2/3) @(QUARK-COLOR red) +2/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) @(QUARK @(QUARK-FLAVOR down -1/3) @(QUARK-COLOR red) -1/3) 0)'
                    ]
                }
            ],
            {path: 'dbs/bio/4', timeout: 1000 * 60 * 60}
        ),
    );
});
