"use strict";

const test = require("../test-utils/test");

/*A stands for Adenine.
C stands for Cytosine.
G stands for Guanine.
T stands for Thymine (in DNA) or Uracil (in RNA).
*/

describe("Bio Tests", () => {
    xit("DNA/RNA Bases",
        test(
            `
                (DNA-BASE '[A C G T])
                (RNA-BASE '[A C G T])
            `, [{
                query: `(DNA-BASE ')`,
                results: [
                   "@(DNA-BASE '_v1:[A C G T])"                
                ]
            }],
            {path: 'dbs/bio/1', timeout: 2000 * 30}
        )
    )

    xit("DNA Sequence",
        test(
            `
                (DNA-BASE '[A C G T])

                (DNA (DNA-BASE 'l) (DNA ' '))
                (DNA (DNA-BASE 'l) (DNA '))
                (DNA (DNA-BASE 'l)) 
            `, [{
                query: `
                    (DNA (DNA-BASE '[A C]) 
                        (DNA (DNA-BASE '[G T]))
                    )
                `,
                results: [
                    "@(DNA @(DNA-BASE '_v1:[A C]) @(DNA @(DNA-BASE '_v2:[G T])))"
                ]
            }],
            {path: 'dbs/bio/2', timeout: 2000 * 30}
        )
    )

    xit("DNA Replication",
        test(
            `
                (DNA-BASE '[A C G T])

                (DNA (DNA-BASE 'l) (DNA ' '))
                (DNA (DNA-BASE 'l) (DNA '))
                (DNA (DNA-BASE 'l))
                
                (Termination 'dna)

                /*
                  * Initiation: The replication process is initiated when a group of proteins recognizes a specific sequence of nucleotides, known as the origin of replication, on the DNA molecule.
                  * Elongation: The DNA polymerases continue to add nucleotides to the newly synthesized strands, building the complementary strands in the 5' to 3' direction.
                  * Termination: Once the replication fork has moved along the entire length of the DNA molecule, the replication process is terminated.
                */

                (DNA-Segment 'x 'x ')
                (DNA-Segment (DNA ' 'x) 'y 
                    (DNA-Segment 'x 'y ')
                )
                (DNA-Segment (DNA 'y 'x) (DNA 'y) ')

                (Elongation 'dna 'origin 'e)


                (Replication 'dna 'template 'origin
                    (DNA-Segment 'dna 'template ')
                    (DNA-Segment 'template 'origin ')
                    # (Elongation 'dna 'i 'e)
                    # (Termination 'e 'dna)
                )
            `, [{
                query: `
                    (Replication 
                        (DNA (DNA-BASE '[A C]) 
                            (DNA (DNA-BASE '[G T]))
                        )
                        'dna
                        'x
                        '
                        '
                    )
                `,
                results: [
                    "@(Replication @(DNA @(DNA-BASE '_v1:[A C]) @(DNA @(DNA-BASE '_v2:[G T]))) @(DNA @(DNA-BASE '_v1:[A C]) @(DNA @(DNA-BASE '_v2:[G T]))) @(Initiation @(DNA @(DNA-BASE '_v1:[A C]) @(DNA @(DNA-BASE '_v2:[G T]))) @(DNA @(DNA-BASE '_v1:[A C]) @(DNA @(DNA-BASE '_v2:[G T]))) 'v$24::_v1))",
                    "@(Replication @(DNA @(DNA-BASE '_v1:[A C]) @(DNA @(DNA-BASE '_v2:[G T]))) @(DNA @(DNA-BASE '_v1:[A C])) @(Initiation @(DNA @(DNA-BASE '_v1:[A C]) @(DNA @(DNA-BASE '_v2:[G T]))) @(DNA @(DNA-BASE '_v1:[A C])) 'v$24::_v1))",
                    "@(Replication @(DNA @(DNA-BASE '_v1:[A C]) @(DNA @(DNA-BASE '_v2:[G T]))) @(DNA @(DNA-BASE '_v2:[G T])) @(Initiation @(DNA @(DNA-BASE '_v1:[A C]) @(DNA @(DNA-BASE '_v2:[G T]))) @(DNA @(DNA-BASE '_v2:[G T])) @(Initiation @(DNA @(DNA-BASE '_v2:[G T])) @(DNA @(DNA-BASE '_v2:[G T])) 'v$31::_v2)))"                ]
            }],
            {path: 'dbs/bio/3', timeout: 2000 * 30}
        )
    )

    xit("DNA/RNA Bases",
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


    xit("DNA Sequence",
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

    xit("Helicases",
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

    xit("Quarks",
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
