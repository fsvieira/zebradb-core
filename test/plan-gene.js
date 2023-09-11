"use strict";

const test = require("../test-utils/test");

describe("Plan Math graphs.", () => {
	it("Plan Genes", test(
		`
            $GENETIC_VARIANT_TYPE = {
                SNP 
                INSERTION 
                DELETION
            }

            $CROMOSOMES = {
                (Chr1 "Genome Source Database")
                (Chr2 "Genome Source Database")
            }

            $GENOMIC_COORDINATES = {
                ('chromosome:$CROMOSOMES 'startPosition:INTEGER 'endPosition:INTEGER) |
            }

            $GENETIC_MUTATION = {
                (
                    'geneticVariantType:$GENETIC_VARIANT_TYPE
                    (
                        'chromosome:$CROMOSOMES 
                        'startPosition:INTEGER 
                        'endPosition:INTEGER
                    ):$GENOMIC_COORDINATES)
                    'variantAnnotations
                ) |
            }

            $GENOME_DATABASE = {
                (
                    'geneticVariantType
                    (
                        'chromosome 
                        'startPosition 
                        'endPosition
                    )
                    'variantAnnotations
                ):$GENETIC_MUTATION
                |
                    startPosition >= 0,
                    endPosition <=100
            }

            $GENETIC_QUERY = {
                (
                    (
                        'mutationType  
                        (
                            'chromosome 
                            'startPosition 
                            'endPosition
                        )  
                        'variantAnnotations
                    ):$GENETIC_MUTATION 
                    's
                ) | 
                    's = {
                        (
                            'mutationType 
                            (
                                'chromosome 
                                'dbStartPosition 
                                'dbEndPosition
                            )
                            'dbVariantAnnotations
                        ):$GENOME_DATABASE | 
                            'variantAnnotations subset 'dbVariantAnnotations,
                            dbStartPosition >= 'startPosition,
                            dbEndPosition <= 'endPosition
                    }
            }
        `, 
		[
			{
				query: `(
                    (
                        SNP  
                        ((Chr1 'database) 10 20)
                        'variantAnnotations
                    )
                    'geneticMutationVariantsInfo
                ):$GENETIC_QUERY`,
				results: [
					"@(0 & 0 = 0)", 
					"@(0 & 1 = 0)", 
					"@(1 & 0 = 0)", 
					"@(1 & 1 = 1)" 
				]
			},
		], 
		{path: 'dbs/plan-gene/1', timeout: 1000 * 60}
	));
});

