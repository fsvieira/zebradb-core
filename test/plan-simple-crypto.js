"use strict";

const test = require("../test-utils/test");

describe("Plan Simple Crypto Tests.", () => {
	it("Crypto Replace Words (1)", test(
		`
			$ALPHABET = {
                A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
            }

            $WORDS = {
                (H E L L O)
                (T A B L E)
                (O C E A N)
                (S T O N E)
                (P L A N T)
                (M A G I C)
                (A P P L E)
                (R I V E R)
                (B E A C H)
                (M U S I C)           
            }

            $CODES = {
                's | ('enc:$ALPHABET 'dec$ALPHABET) in 's,
                      'e != 'enc , 'd != 'dec,
                      ('e 'dec) not in 's,
                      ('enc 'd) not in 's
            }

            $CYPHER = {
                ('enc 'dec:$WORDS 'code:$CODES) |
                    ('a 'b 'c 'd 'e) = 'enc,
                    ('a1 'b1 'c1 'd1 'e1) = 'dec,
                    ('a 'a1):$code,
                    ('b 'b1):$code,
                    ('c 'c1):$code,
                    ('d 'd1):$code,
                    ('e 'e1):$code
            }
        `, 
		[
			{
				query: "('enc 'dec 'codes):$CYPHER",
				results: [
					"@(0 & 0 = 0)", 
					"@(0 & 1 = 0)", 
					"@(1 & 0 = 0)", 
					"@(1 & 1 = 1)" 
				]
			},
		], 
		{path: 'dbs/plan-simple-crypto/1', timeout: 1000 * 60}
	));

    it("Crypto Replace Words (2)", test(
		`
			$ALPHABET = {
                A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
            }

            $WORDS = {
                (H E L L O)
                (T A B L E)
                (O C E A N)
                (S T O N E)
                (P L A N T)
                (M A G I C)
                (A P P L E)
                (R I V E R)
                (B E A C H)
                (M U S I C)           
            }

            $CODE_MAP = {
                ('s 'enc_codes 'dec_codes) |
                    'enc_codes subset $ALPHABET,
                    'dec_codes subset $ALPHABET,
                    ('e:'enc_codes 'd:'dec_codes) in 's,
                    'ec = 'enc_codes except 'e,
                    'dc = 'dec_codes except 'd,
                    ('s 'ec 'dc):$CODE_MAP 
            }

            $CODES = {
                's | ('s $ALPHABET $ALPHABET):$CODE_MAP
            }

            $CYPHER = {
                ('enc 'dec:$WORDS 'code:$CODES) |
                    ('a 'b 'c 'd 'e) = 'enc,
                    ('a1 'b1 'c1 'd1 'e1) = 'dec,
                    ('a 'a1):$code,
                    ('b 'b1):$code,
                    ('c 'c1):$code,
                    ('d 'd1):$code,
                    ('e 'e1):$code
            }
        `, 
		[
			{
				query: "('enc 'dec 'codes):$CYPHER",
				results: [
					"@(0 & 0 = 0)", 
					"@(0 & 1 = 0)", 
					"@(1 & 0 = 0)", 
					"@(1 & 1 = 1)" 
				]
			},
		], 
		{path: 'dbs/plan-simple-crypto/2', timeout: 1000 * 60}
	));

});

