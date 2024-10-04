"use strict";

const test = require("../test-utils/test");

/*
A(m, n) = 
  if m = 0 then 
    n + 1 
  else if m > 0 and n = 0 then 
    A(m - 1, 1) 
  else if m > 0 and n > 0 then 
    A(m - 1, A(m, n - 1))

*/


describe("Ackerman", () => {
    it("Nat Definition", test(`
        $NAT = {0} union {(nat 'x:$NAT) ...}
       
        theorem $NAT inductive : exists 0:$NAT [0 in $NAT],
        forall 'x, (nat 'x):$NAT [
            (nat (nat 'x)) in $NAT
        ]

        $SUCC = {(succ 'x:$NAT (nat 'x):$NAT ) ...}

        /*
        theorem $SUCC inductive: exist 0:NAT, (succ 0 'r):$SUCC [
            'r in $NAT
        ]
        forall 'x, (succ 'x 'r):SUCC [
            'x in $NAT, 'r in $NAT
        ]*/


        /* THIS PROOFS THE CORRECTNESS OF SUCC, WHY
            1. this will prove that 'x and 'r will work has expected forall 'x and 'r,
            2. proof body must work has a property testing without eval anything unless 
               variables gets the correct values,
            3. If succ was not well defined for example : $succ = {(succ 'x:$NAT 'r)} the proof 
                would get it. 
            4. on the second part of proof forall 'n , the 'r!=0 is not so obviusly and if not 
               specified the proof would fail for 'r = 0, however the way that proofs should work 
               this would not have happen unless we did something like:
                forall 'r:$NAT, (succ 'x 'r):$SUCC ... but in this case we would want to 
                proof that forall 'r in $NAT the proof was true. its not the case, 
                and so when we get succ definition element we can see the only possible 
                'n value is (nat 'x):$NAT.
            
            To process:
                1. create element (succ 'a:$NAT (nat 'a:$NAT):$NAT) from set $SUCC
                2. create an element with variables (succ 'x 'r)
                3. unify (succ 'x 'r) * ('a:$NAT (nat 'a:$NAT):$NAT),
                4. solve element:
                    4a. now we can solve the element until forall or body variables are solved,
                    4b. or we can evaluate the domains of forall variables and apply, 
                        note: 4a aproach seems more safe and in-line with the rest 
                5. We now execute the body has a test env, similiar to or branching.
                6. if we are not able to eval all conditions in body proof the proof will fail.
            
        */
        theorem $SUCC correctness: forall 'x, (succ 'x 'r):SUCC [
            'x in $NAT, 'r in $NAT, 'r = (nat 'x)
        ],
        forall 'r!=0, (succ 'x 'r):SUCC [
            'x in $NAT, 'r in $NAT, 'r = (nat 'x)
        ]

        
    `),
    it("Akermane Definition", test(`
        $ACK_1 = {(0 'n 'r)  | 'r = 'n + 1, 'n = 'r - 1}
        $ACK_2 = {('m 0 'r)  | 'm > 0, 'm1 = 'm - 1, 'm = 'm1 + 1, ('m1 1 'r) in $ACK }
        $ACK_3 = {('m 'n 'r) | 
            'm1 = 'm - 1, 'm = 'm1 + 1, 
            'n1 = 'n - 1, 'n = 'n1 + 1,
            ('m 'n1, 'r1) in $ACK,
            ('m1 'r1 'r) in $ACK
        }

        $ACK = ACK_1 union ACK_2 union ACK_3
    `,
        [
            {
                query: `{ 'x:$BOOL ...}`,
                results: [
                    `
                        $BOOL = {0 1}
                        {'x:$BOOL }
                    `
                ]
            },
            {
                query: `{ 'x:$BOOL | 'x = 0}`,
                results: [
                    `
                        $BOOL = {0 1}
                        {'x:$BOOL }
                    `
                ]
            }
        ], 
        {
            path: 'dbs/1-z-proofs/types', 
            timeout: 1000 * 60 * 60,
            log: true
        }
    ));
});

