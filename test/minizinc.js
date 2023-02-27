"use strict";

const test = require("../test-utils/test");

describe("Minizinc Tests.", () => {

    /*
        TODO: Problem: 
            * it still test all values, consider using domains systems.
    */

	it("Minizinc example.",
		test(
            /*
            % Colouring Australia using nc colours
            int: nc = 3;

            var 1..nc: wa;   var 1..nc: nt;  var 1..nc: sa;   var 1..nc: q;
            var 1..nc: nsw;  var 1..nc: v;   var 1..nc: t;

            constraint wa != nt;
            constraint wa != sa;
            constraint nt != sa;
            constraint nt != q;
            constraint sa != q;
            constraint sa != nsw;
            constraint sa != v;
            constraint q != nsw;
            constraint nsw != v;
            solve satisfy;

            output ["wa=\(wa)\t nt=\(nt)\t sa=\(sa)\n",
                    "q=\(q)\t nsw=\(nsw)\t v=\(v)\n",
                    "t=", show(t),  "\n"];
*/
			`
            (1..nc '{1 2 3})
            (var (1..nc 'x) : 'x)
            ('x != ~'x)

            (var-declaration
                'wa 'nt 'sa 'q
                'nsw 'v 't
            )

            (var-constrains 
                'wa_nt
                'wa_sa
                'nt_sa
                'nt_q
                'sa_q
                'sa_nsw
                'sa_v
                'q_nsw
                'nsw_v       
            )

            (output
                wa= 'wa 
                nt= 'nt
                sa= 'sa
                q= 'q 
                nsw= 'nsw
                v= 'v
                t= 't    
            )

            (zinc
                (var-declaration
                    (var (1..nc 'wa) : 'wa)
                    (var (1..nc 'nt) : 'nt)
                    (var (1..nc 'sa) : 'sa)
                    (var (1..nc 'q) : 'q)
                    (var (1..nc 'nsw) : 'nsw)
                    (var (1..nc 'v) : 'v)
                    (var (1..nc 't) : 't)
                )

                (var-constrains 
                    ('wa != 'nt)
                    ('wa != 'sa)
                    ('nt != 'sa)
                    ('nt != 'q)
                    ('sa != 'q)
                    ('sa != 'nsw)
                    ('sa != 'v)
                    ('q != 'nsw)
                    ('nsw != 'v)
                )

                (output 
                    wa= 'wa 
                    nt= 'nt
                    sa= 'sa
                    q= 'q 
                    nsw= 'nsw
                    v= 'v
                    t= 't    
                )
            )
                
            `, [{
				query: "(zinc ' ' ')",
				results: [
                    "@(zinc @(var-declaration @(var @(1..nc 1) : 1) @(var @(1..nc 2) : 2) @(var @(1..nc 3) : 3) @(var @(1..nc 1) : 1) @(var @(1..nc 2) : 2) @(var @(1..nc 1) : 1) @(var @(1..nc \'v$23::t:{1 2 3}) : \'v$23::t:{1 2 3})) @(var-constrains @(1 != 2) @(1 != 3) @(2 != 3) @(2 != 1) @(3 != 1) @(3 != 2) @(3 != 1) @(1 != 2) @(2 != 1)) @(output wa= 1 nt= 2 sa= 3 q= 1 nsw= 2 v= 1 t= 'v$23::t:{1 2 3}))",
                    "@(zinc @(var-declaration @(var @(1..nc 1) : 1) @(var @(1..nc 3) : 3) @(var @(1..nc 2) : 2) @(var @(1..nc 1) : 1) @(var @(1..nc 3) : 3) @(var @(1..nc 1) : 1) @(var @(1..nc \'v$23::t:{1 2 3}) : \'v$23::t:{1 2 3})) @(var-constrains @(1 != 3) @(1 != 2) @(3 != 2) @(3 != 1) @(2 != 1) @(2 != 3) @(2 != 1) @(1 != 3) @(3 != 1)) @(output wa= 1 nt= 3 sa= 2 q= 1 nsw= 3 v= 1 t= 'v$23::t:{1 2 3}))",
                    "@(zinc @(var-declaration @(var @(1..nc 2) : 2) @(var @(1..nc 1) : 1) @(var @(1..nc 3) : 3) @(var @(1..nc 2) : 2) @(var @(1..nc 1) : 1) @(var @(1..nc 2) : 2) @(var @(1..nc \'v$23::t:{1 2 3}) : \'v$23::t:{1 2 3})) @(var-constrains @(2 != 1) @(2 != 3) @(1 != 3) @(1 != 2) @(3 != 2) @(3 != 1) @(3 != 2) @(2 != 1) @(1 != 2)) @(output wa= 2 nt= 1 sa= 3 q= 2 nsw= 1 v= 2 t= 'v$23::t:{1 2 3}))",
                    "@(zinc @(var-declaration @(var @(1..nc 2) : 2) @(var @(1..nc 3) : 3) @(var @(1..nc 1) : 1) @(var @(1..nc 2) : 2) @(var @(1..nc 3) : 3) @(var @(1..nc 2) : 2) @(var @(1..nc \'v$23::t:{1 2 3}) : \'v$23::t:{1 2 3})) @(var-constrains @(2 != 3) @(2 != 1) @(3 != 1) @(3 != 2) @(1 != 2) @(1 != 3) @(1 != 2) @(2 != 3) @(3 != 2)) @(output wa= 2 nt= 3 sa= 1 q= 2 nsw= 3 v= 2 t= 'v$23::t:{1 2 3}))",
                    "@(zinc @(var-declaration @(var @(1..nc 3) : 3) @(var @(1..nc 1) : 1) @(var @(1..nc 2) : 2) @(var @(1..nc 3) : 3) @(var @(1..nc 1) : 1) @(var @(1..nc 3) : 3) @(var @(1..nc \'v$23::t:{1 2 3}) : \'v$23::t:{1 2 3})) @(var-constrains @(3 != 1) @(3 != 2) @(1 != 2) @(1 != 3) @(2 != 3) @(2 != 1) @(2 != 3) @(3 != 1) @(1 != 3)) @(output wa= 3 nt= 1 sa= 2 q= 3 nsw= 1 v= 3 t= 'v$23::t:{1 2 3}))",
                    "@(zinc @(var-declaration @(var @(1..nc 3) : 3) @(var @(1..nc 2) : 2) @(var @(1..nc 1) : 1) @(var @(1..nc 3) : 3) @(var @(1..nc 2) : 2) @(var @(1..nc 3) : 3) @(var @(1..nc \'v$23::t:{1 2 3}) : \'v$23::t:{1 2 3})) @(var-constrains @(3 != 2) @(3 != 1) @(2 != 1) @(2 != 3) @(1 != 3) @(1 != 2) @(1 != 3) @(3 != 2) @(2 != 3)) @(output wa= 3 nt= 2 sa= 1 q= 3 nsw= 2 v= 3 t= 'v$23::t:{1 2 3}))"
                ]
			}],
			{path: 'dbs/minizinc/1', timeout: 1000 * 60 * 60 * 24}
		)
	);
});
