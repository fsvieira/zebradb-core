"use strict";

const test = require("../test-utils/test");

describe("Set Operations", () => {
	it("Subset (1)", test(`
            $FIRST_NAMES = {
                (John    Male)
                (Mary    Female)
                (Michael Male)
                (Emily   Female)
                (David   Male)
                (Emma    Female)
                (James   Male)
                (Olivia  Female)
                (William Male)
                (Sophia  Female)
                (Jack    Male)
            }
            
            $LAST_NAMES = {
                Smith
                Johnson
                Williams
                Jones
                Brown
                Davis
                Miller
                Wilson
                Moore
                Taylor
                McAllister
            }

            $PERSON = {
                {
                    ('first_name 'last_name:$LAST_NAMES 'gender) 
                    | ('first_name 'gender) in $FIRST_NAMES
                } ['first_name, 'last_name] is unique
            }


            $DETECTIVE_ACTIONS = {
                (ASK)
                (INVESTIGATE)
            }

            $DETECTIVE_STORIES = {
                {('detective:$PERSON 'clues 'next)} | 
                    ... next :
                    1. deduction,
                    2. investigate, is there more clues ? 
                        * for example new places ?
                        * new evidences ?
                        * new information ? 
                    3. ask, we need to select a person and a question:
                        * new information that needs to be checked, and catch contradictions,
                        * someone that remebered something,
                        * someone that want to confess something,
                            - this last ones would be victim / suspects / witness actions
                    -- so we maybe need to enconde also event actions from all persons, or 
                        stuff that happens.  
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

});

