"use strict";

const test = require("../test-utils/test");

describe("Math Tests", () => {
    it("should define floats Fixed-Point", 
        test(`
            (float32 
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
                . 
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
            )
        `, [{
            query: `
                (float32 
                    0 0 0 0 0 0 0 0
                    0 0 0 0 0 0 0 1
                    . 
                    0 0 0 0 0 0 0 0
                    0 0 0 0 0 0 0 0
                )
            `,
            results: [
                "@(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0)"
            ]
        }], 
        { 
            timeout: 60000 * 35,
            path: 'dbs/math/1'
        })
    )

    it("should define Add floats Fixed-Point", 
        test(`
            (float32 
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
                . 
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
            )
            
                                    
            #     Cin   A   B   S   Cout
            (adder 0    0   0   0    0)
            (adder 1    0   0   1    0)
            (adder 0    0   1   1    0)
            (adder 1    0   1   0    1)
            (adder 0    1   0   1    0)
            (adder 1    1   0   0    1)
            (adder 0    1   1   0    1)
            (adder 1    1   1   1    1)
                        
            (
                (float32
                    'x1 'x2 'x3 'x4 'x5 'x6 'x7 'x8  
                    'x9 'x10 'x11 'x12 'x13 'x14 'x15 'x16 
                    .
                    'x17 'x18 'x19 'x20 'x21 'x22 'x23 'x24  
                    'x25 'x26 'x27 'x28 'x29 'x30 'x31 'x32 
                )
                +
                (float32
                    'y1 'y2 'y3 'y4 'y5 'y6 'y7 'y8  
                    'y9 'y10 'y11 'y12 'y13 'y14 'y15 'y16 
                    .
                    'y17 'y18 'y19 'y20 'y21 'y22 'y23 'y24  
                    'y25 'y26 'y27 'y28 'y29 'y30 'y31 'y32 
                )
                =
                (float32
                    'z1 'z2 'z3 'z4 'z5 'z6 'z7 'z8  
                    'z9 'z10 'z11 'z12 'z13 'z14 'z15 'z16 
                    .
                    'z17 'z18 'z19 'z20 'z21 'z22 'z23 'z24  
                    'z25 'z26 'z27 'z28 'z29 'z30 'z31 'z32 
                )
            ) where
                (adder 0    'x32 'y32 'z32 'c1)
                (adder 'c1  'x31 'y31 'z31 'c2)
                (adder 'c2  'x30 'y30 'z30 'c3)
                (adder 'c3  'x29 'y29 'z29 'c4)
                (adder 'c4  'x28 'y28 'z28 'c5)
                (adder 'c5  'x27 'y27 'z27 'c6)
                (adder 'c6  'x26 'y26 'z26 'c7)
                (adder 'c7  'x25 'y25 'z25 'c8)
                (adder 'c8  'x24 'y24 'z24 'c9)
                (adder 'c9  'x23 'y23 'z23 'c10)
                (adder 'c10 'x22 'y22 'z22 'c11)
                (adder 'c11 'x21 'y21 'z21 'c12)
                (adder 'c12 'x20 'y20 'z20 'c13)
                (adder 'c13 'x19 'y19 'z19 'c14)
                (adder 'c14 'x18 'y18 'z18 'c15)
                (adder 'c15 'x17 'y17 'z17 'c16)
                (adder 'c16 'x16 'y16 'z16 'c17)
                (adder 'c17 'x15 'y15 'z15 'c18)
                (adder 'c18 'x14 'y14 'z14 'c19)
                (adder 'c19 'x13 'y13 'z13 'c20)
                (adder 'c20 'x12 'y12 'z12 'c21)
                (adder 'c21 'x11 'y11 'z11 'c22)
                (adder 'c22 'x10 'y10 'z10 'c23)
                (adder 'c23 'x9  'y9  'z9 'c24)
                (adder 'c24 'x8  'y8  'z8 'c25)
                (adder 'c25 'x7  'y7  'z7 'c26)
                (adder 'c26 'x6  'y6  'z6 'c27)
                (adder 'c27 'x5  'y5  'z5 'c28)
                (adder 'c28 'x4  'y4  'z4 'c29)
                (adder 'c29 'x3  'y3  'z3 'c30)
                (adder 'c30 'x2  'y2  'z2 'c31)
                (adder 'c31 'x1  'y1  'z1 'z0)
            end
        `, [{
            query: `
                (
                    (float32
                        0 0 0 0 0 0 0 0
                        0 0 0 0 0 0 0 1
                        . 
                        0 0 0 0 0 0 0 0
                        0 0 0 0 0 0 0 0
                    )
                    +
                    (float32
                        0 0 0 0 0 0 0 0
                        0 0 0 0 0 0 1 1
                        . 
                        0 0 0 0 0 0 0 0
                        0 0 0 0 0 0 0 0
                    )
                    =
                    'z
                )
            `,
            results: [
                "@(@(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) + @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) = @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0))"
            ]
        }], 
        { 
            timeout: 60000 * 35,
            path: 'dbs/math/2'
        })
    )

    it("should define binary Adder", 
        test(
            `
                #     Cin   A   B   S   Cout
                (adder 'z:{0 1} 'z 'z 'z 'z)
                # (adder 0    0   0   0    0)
                # (adder 1    1   1   1    1)
                
                (adder  'o:{0 1}~'z:{0 1} 'z  'o  'z   'o)
                # (adder        1          0   1   0    1)
                # (adder        0          1   0   1    0)
                
                (adder  'o:{0 1}~'z:{0 1} 'z  'z  'o   'z)
                # (adder        1          0   0   1    0)
                # (adder        0          1   1   0    1)
                
                (adder  'o:{0 1}~'z:{0 1} 'o  'z  'z   'o)
                # (adder        1          1   0   0    1)
                # (adder        0          0   1   1    0)
            `,
            [
                {
                    query: "(adder '{0 1} '{0 1} '{0 1}  '{0 1} '{0 1})",
                    results: [
                        "@(adder 'v$2:{0 1} 'v$2:{0 1} 'v$2:{0 1} 'v$2:{0 1} 'v$2:{0 1})",
                        "@(adder 0 0 1 1 0)",
                        "@(adder 0 1 0 1 0)",
                        "@(adder 0 1 1 0 1)",
                        "@(adder 1 0 0 1 0)",
                        "@(adder 1 0 1 0 1)",
                        "@(adder 1 1 0 0 1)"
                    ]
                }
            ],
            { 
                timeout: 60000 * 35,
                path: 'dbs/math/3'
            }   
        )
    ) 

    it("should define Add floats Fixed-Point (2)", 
        test(`
            (float32 
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
                . 
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
            )

            #     Cin   A   B   S   Cout
            (adder 'z:{0 1} 'z 'z 'z 'z)
            # (adder 0    0   0   0    0)
            # (adder 1    1   1   1    1)
            
            (adder  'o:{0 1}~'z:{0 1} 'z  'o  'z   'o)
            # (adder        1          0   1   0    1)
            # (adder        0          1   0   1    0)
            
            (adder  'o:{0 1}~'z:{0 1} 'z  'z  'o   'z)
            # (adder        1          0   0   1    0)
            # (adder        0          1   1   0    1)
            
            (adder  'o:{0 1}~'z:{0 1} 'o  'z  'z   'o)
            # (adder        1          1   0   0    1)
            # (adder        0          0   1   1    0)
            
            (
                (float32
                    'x1 'x2 'x3 'x4 'x5 'x6 'x7 'x8  
                    'x9 'x10 'x11 'x12 'x13 'x14 'x15 'x16 
                    .
                    'x17 'x18 'x19 'x20 'x21 'x22 'x23 'x24  
                    'x25 'x26 'x27 'x28 'x29 'x30 'x31 'x32 
                )
                +
                (float32
                    'y1 'y2 'y3 'y4 'y5 'y6 'y7 'y8  
                    'y9 'y10 'y11 'y12 'y13 'y14 'y15 'y16 
                    .
                    'y17 'y18 'y19 'y20 'y21 'y22 'y23 'y24  
                    'y25 'y26 'y27 'y28 'y29 'y30 'y31 'y32 
                )
                =
                (float32
                    'z1 'z2 'z3 'z4 'z5 'z6 'z7 'z8  
                    'z9 'z10 'z11 'z12 'z13 'z14 'z15 'z16 
                    .
                    'z17 'z18 'z19 'z20 'z21 'z22 'z23 'z24  
                    'z25 'z26 'z27 'z28 'z29 'z30 'z31 'z32 
                )
            ) where
                (adder 0    'x32 'y32 'z32 'c1)
                (adder 'c1  'x31 'y31 'z31 'c2)
                (adder 'c2  'x30 'y30 'z30 'c3)
                (adder 'c3  'x29 'y29 'z29 'c4)
                (adder 'c4  'x28 'y28 'z28 'c5)
                (adder 'c5  'x27 'y27 'z27 'c6)
                (adder 'c6  'x26 'y26 'z26 'c7)
                (adder 'c7  'x25 'y25 'z25 'c8)
                (adder 'c8  'x24 'y24 'z24 'c9)
                (adder 'c9  'x23 'y23 'z23 'c10)
                (adder 'c10 'x22 'y22 'z22 'c11)
                (adder 'c11 'x21 'y21 'z21 'c12)
                (adder 'c12 'x20 'y20 'z20 'c13)
                (adder 'c13 'x19 'y19 'z19 'c14)
                (adder 'c14 'x18 'y18 'z18 'c15)
                (adder 'c15 'x17 'y17 'z17 'c16)
                (adder 'c16 'x16 'y16 'z16 'c17)
                (adder 'c17 'x15 'y15 'z15 'c18)
                (adder 'c18 'x14 'y14 'z14 'c19)
                (adder 'c19 'x13 'y13 'z13 'c20)
                (adder 'c20 'x12 'y12 'z12 'c21)
                (adder 'c21 'x11 'y11 'z11 'c22)
                (adder 'c22 'x10 'y10 'z10 'c23)
                (adder 'c23 'x9  'y9  'z9 'c24)
                (adder 'c24 'x8  'y8  'z8 'c25)
                (adder 'c25 'x7  'y7  'z7 'c26)
                (adder 'c26 'x6  'y6  'z6 'c27)
                (adder 'c27 'x5  'y5  'z5 'c28)
                (adder 'c28 'x4  'y4  'z4 'c29)
                (adder 'c29 'x3  'y3  'z3 'c30)
                (adder 'c30 'x2  'y2  'z2 'c31)
                (adder 'c31 'x1  'y1  'z1 'z0)
            end
            
        `, [{
            query: `
                ( 
                    (float32
                        0 0 0 0 0 0 0 0
                        0 0 0 0 0 0 0 1
                        . 
                        0 0 0 0 0 0 0 0
                        0 0 0 0 0 0 0 0
                    )
                    +
                    (float32
                        0 0 0 0 0 0 0 0
                        0 0 0 0 0 0 1 1
                        . 
                        0 0 0 0 0 0 0 0
                        0 0 0 0 0 0 0 0
                    )
                    =
                    'z
                )
            `,
            results: [
                "@(@(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) + @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) = @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0))"
            ]
        }], 
        { 
            timeout: 60000 * 35,
            path: 'dbs/math/3'
        })
    )

    it("Sub Floats",
        test(`
            (float32 
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
                . 
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
            )
                        
            #     Cin   A   B   S   Cout
            (adder 0    0   0   0    0)
            (adder 1    0   0   1    0)
            (adder 0    0   1   1    0)
            (adder 1    0   1   0    1)
            (adder 0    1   0   1    0)
            (adder 1    1   0   0    1)
            (adder 0    1   1   0    1)
            (adder 1    1   1   1    1)
            
            (
                (float32
                    'x1 'x2 'x3 'x4 'x5 'x6 'x7 'x8  
                    'x9 'x10 'x11 'x12 'x13 'x14 'x15 'x16 
                    .
                    'x17 'x18 'x19 'x20 'x21 'x22 'x23 'x24  
                    'x25 'x26 'x27 'x28 'x29 'x30 'x31 'x32 
                )
                +
                (float32
                    'y1 'y2 'y3 'y4 'y5 'y6 'y7 'y8  
                    'y9 'y10 'y11 'y12 'y13 'y14 'y15 'y16 
                    .
                    'y17 'y18 'y19 'y20 'y21 'y22 'y23 'y24  
                    'y25 'y26 'y27 'y28 'y29 'y30 'y31 'y32 
                )
                =
                (float32
                    'z1 'z2 'z3 'z4 'z5 'z6 'z7 'z8  
                    'z9 'z10 'z11 'z12 'z13 'z14 'z15 'z16 
                    .
                    'z17 'z18 'z19 'z20 'z21 'z22 'z23 'z24  
                    'z25 'z26 'z27 'z28 'z29 'z30 'z31 'z32 
                )
            ) where
                (adder 0    'x32 'y32 'z32 'c1)
                (adder 'c1  'x31 'y31 'z31 'c2)
                (adder 'c2  'x30 'y30 'z30 'c3)
                (adder 'c3  'x29 'y29 'z29 'c4)
                (adder 'c4  'x28 'y28 'z28 'c5)
                (adder 'c5  'x27 'y27 'z27 'c6)
                (adder 'c6  'x26 'y26 'z26 'c7)
                (adder 'c7  'x25 'y25 'z25 'c8)
                (adder 'c8  'x24 'y24 'z24 'c9)
                (adder 'c9  'x23 'y23 'z23 'c10)
                (adder 'c10 'x22 'y22 'z22 'c11)
                (adder 'c11 'x21 'y21 'z21 'c12)
                (adder 'c12 'x20 'y20 'z20 'c13)
                (adder 'c13 'x19 'y19 'z19 'c14)
                (adder 'c14 'x18 'y18 'z18 'c15)
                (adder 'c15 'x17 'y17 'z17 'c16)
                (adder 'c16 'x16 'y16 'z16 'c17)
                (adder 'c17 'x15 'y15 'z15 'c18)
                (adder 'c18 'x14 'y14 'z14 'c19)
                (adder 'c19 'x13 'y13 'z13 'c20)
                (adder 'c20 'x12 'y12 'z12 'c21)
                (adder 'c21 'x11 'y11 'z11 'c22)
                (adder 'c22 'x10 'y10 'z10 'c23)
                (adder 'c23 'x9  'y9  'z9 'c24)
                (adder 'c24 'x8  'y8  'z8 'c25)
                (adder 'c25 'x7  'y7  'z7 'c26)
                (adder 'c26 'x6  'y6  'z6 'c27)
                (adder 'c27 'x5  'y5  'z5 'c28)
                (adder 'c28 'x4  'y4  'z4 'c29)
                (adder 'c29 'x3  'y3  'z3 'c30)
                (adder 'c30 'x2  'y2  'z2 'c31)
                (adder 'c31 'x1  'y1  'z1 'z0)
            end
            
            ('x - 'y = 'z) where ('z + 'y = 'x) end
        `,
            [
                {
                    'query': `( 
                        (float32
                            0 0 0 0 0 0 0 0
                            0 0 0 0 0 0 1 1
                            . 
                            0 0 0 0 0 0 0 0
                            0 0 0 0 0 0 0 0
                        )
                        +
                        (float32
                            0 0 0 0 0 0 0 0
                            0 0 0 0 0 1 1 1
                            . 
                            0 0 0 0 0 0 0 0
                            0 0 0 0 0 0 0 0
                        )
                        =
                        'z
                    )`,
                    results: [
                        "@(@(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) + @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) = @(float32 0 0 0 0 0 0 0 0 0 0 0 0 1 0 1 0 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0))"
                    ]
                },
                {
                    'query': `( 
                        (float32
                            0 0 0 0 0 0 0 0
                            0 0 0 0 0 0 1 1
                            . 
                            0 0 0 0 0 0 0 0
                            0 0 0 0 0 0 0 0
                        )
                        -
                        (float32
                            0 0 0 0 0 0 0 0
                            0 0 0 0 0 1 1 1
                            . 
                            0 0 0 0 0 0 0 0
                            0 0 0 0 0 0 0 0
                        )
                        =
                        'z
                    )`,
                    results: [
                        "@(@(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) - @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) = @(float32 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0))"
                    ]
                },
                {
                    'query': `( 
                        (float32
                            0 0 0 0 0 0 0 0
                            0 0 0 0 1 0 1 1
                            . 
                            0 0 0 0 0 0 0 0
                            0 0 0 0 0 0 0 0
                        )
                        -
                        (float32
                            0 0 0 0 0 0 0 0
                            0 0 0 0 0 1 1 1
                            . 
                            0 0 0 0 0 0 0 0
                            0 0 0 0 0 0 0 0
                        )
                        =
                        'z
                    )`,
                    results: [
                        "@(@(float32 0 0 0 0 0 0 0 0 0 0 0 0 1 0 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) - @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) = @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0))"
                    ]
                },
                {
                    // 1 - 3 = -2
                    'query': `( 
                        (float32
                            0 0 0 0 0 0 0 0
                            0 0 0 0 0 0 0 1
                            . 
                            0 0 0 0 0 0 0 0
                            0 0 0 0 0 0 0 0
                        )
                        -
                        (float32
                            0 0 0 0 0 0 0 0
                            0 0 0 0 0 0 1 1
                            . 
                            0 0 0 0 0 0 0 0
                            0 0 0 0 0 0 0 0
                        )
                        =
                        'z
                    )`,
                    results: [
                        "@(@(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) - @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) = @(float32 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0))"
                    ]
                },
                {
                    // -1 + 1 = 0
                    'query': `( 
                        (float32
                            1 1 1 1 1 1 1 1
                            1 1 1 1 1 1 1 1
                            . 
                            0 0 0 0 0 0 0 0
                            0 0 0 0 0 0 0 0
                        )
                        +
                        (float32
                            0 0 0 0 0 0 0 0
                            0 0 0 0 0 0 0 1
                            . 
                            0 0 0 0 0 0 0 0
                            0 0 0 0 0 0 0 0
                        )
                        =
                        'z
                    )`,
                    results: [
                        "@(@(float32 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) + @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) = @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0))"
                    ]
                }
            ],
            {
                path: 'dbs/math/4',
                timeout: 1000 * 60
            }
        )
    )

    /*
        16-bits: 8 bits for the integer part and 8 bits for the fractional part. This is represented as Q8.8, it is a common representation for embedded systems, audio and video applications

        32-bits: 16 bits for the integer part and 16 bits for the fractional part. This is represented as Q16.16, it is common in digital signal processing, control systems and some audio and video applications.

        64-bits: 32 bits for the integer part and 32 bits for the fractional part. This is represented as Q32.32, it is common in scientific computing and high-precision applications.
    */

    xit("Mul Floats",
        test(`
            (float32 
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
                . 
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
            )
                        
            #     Cin   A   B   S   Cout
            (adder 0    0   0   0    0)
            (adder 1    0   0   1    0)
            (adder 0    0   1   1    0)
            (adder 1    0   1   0    1)
            (adder 0    1   0   1    0)
            (adder 1    1   0   0    1)
            (adder 0    1   1   0    1)
            (adder 1    1   1   1    1)
            
            (
                (float32
                    'x1 'x2 'x3 'x4 'x5 'x6 'x7 'x8  
                    'x9 'x10 'x11 'x12 'x13 'x14 'x15 'x16 
                    .
                    'x17 'x18 'x19 'x20 'x21 'x22 'x23 'x24  
                    'x25 'x26 'x27 'x28 'x29 'x30 'x31 'x32 
                )
                +
                (float32
                    'y1 'y2 'y3 'y4 'y5 'y6 'y7 'y8  
                    'y9 'y10 'y11 'y12 'y13 'y14 'y15 'y16 
                    .
                    'y17 'y18 'y19 'y20 'y21 'y22 'y23 'y24  
                    'y25 'y26 'y27 'y28 'y29 'y30 'y31 'y32 
                )
                =
                (float32
                    'z1 'z2 'z3 'z4 'z5 'z6 'z7 'z8  
                    'z9 'z10 'z11 'z12 'z13 'z14 'z15 'z16 
                    .
                    'z17 'z18 'z19 'z20 'z21 'z22 'z23 'z24  
                    'z25 'z26 'z27 'z28 'z29 'z30 'z31 'z32 
                )
            ) where
                (adder 0    'x32 'y32 'z32 'c1)
                (adder 'c1  'x31 'y31 'z31 'c2)
                (adder 'c2  'x30 'y30 'z30 'c3)
                (adder 'c3  'x29 'y29 'z29 'c4)
                (adder 'c4  'x28 'y28 'z28 'c5)
                (adder 'c5  'x27 'y27 'z27 'c6)
                (adder 'c6  'x26 'y26 'z26 'c7)
                (adder 'c7  'x25 'y25 'z25 'c8)
                (adder 'c8  'x24 'y24 'z24 'c9)
                (adder 'c9  'x23 'y23 'z23 'c10)
                (adder 'c10 'x22 'y22 'z22 'c11)
                (adder 'c11 'x21 'y21 'z21 'c12)
                (adder 'c12 'x20 'y20 'z20 'c13)
                (adder 'c13 'x19 'y19 'z19 'c14)
                (adder 'c14 'x18 'y18 'z18 'c15)
                (adder 'c15 'x17 'y17 'z17 'c16)
                (adder 'c16 'x16 'y16 'z16 'c17)
                (adder 'c17 'x15 'y15 'z15 'c18)
                (adder 'c18 'x14 'y14 'z14 'c19)
                (adder 'c19 'x13 'y13 'z13 'c20)
                (adder 'c20 'x12 'y12 'z12 'c21)
                (adder 'c21 'x11 'y11 'z11 'c22)
                (adder 'c22 'x10 'y10 'z10 'c23)
                (adder 'c23 'x9  'y9  'z9 'c24)
                (adder 'c24 'x8  'y8  'z8 'c25)
                (adder 'c25 'x7  'y7  'z7 'c26)
                (adder 'c26 'x6  'y6  'z6 'c27)
                (adder 'c27 'x5  'y5  'z5 'c28)
                (adder 'c28 'x4  'y4  'z4 'c29)
                (adder 'c29 'x3  'y3  'z3 'c30)
                (adder 'c30 'x2  'y2  'z2 'c31)
                (adder 'c31 'x1  'y1  'z1 'z0)
            end

            (shift 
                (float32
                    'y1 'y2 'y3 'y4 'y5 'y6 'y7 'y8  
                    'y9 'y10 'y11 'y12 'y13 'y14 'y15 'y16 
                    .
                    'y17 'y18 'y19 'y20 'y21 'y22 'y23 'y24  
                    'y25 'y26 'y27 'y28 'y29 'y30 'y31 'y32 
                )
                (float32
                    'y2 'y3 'y4 'y5 'y6 'y7 'y8  
                    'y9 'y10 'y11 'y12 'y13 'y14 'y15 'y16 'y17
                    .
                    'y18 'y19 'y20 'y21 'y22 'y23 'y24  
                    'y25 'y26 'y27 'y28 'y29 'y30 'y31 'y32 0
                )
            )

            (cond-add 1 'x 'y 'z ('x + 'y = 'z))
            (cond-add 0 'x 'y 'y ')
            (if 1 'x 'y 'x )
            (if 0 'x 'y 'y )

            (
                'x
                *
                (float32
                    'y1 'y2 'y3 'y4 'y5 'y6 'y7 'y8  
                    'y9 'y10 'y11 'y12 'y13 'y14 'y15 'y16 
                    .
                    'y17 'y18 'y19 'y20 'y21 'y22 'y23 'y24  
                    'y25 'y26 'y27 'y28 'y29 'y30 'y31 'y32 
                )
                =
                'z
            ) where
                (if 'y16 'x  
                    (float32
                        0 0 0 0 0 0 0 0 
                        0 0 0 0 0 0 0 0
                        .
                        0 0 0 0 0 0 0 0 
                        0 0 0 0 0 0 0 0
                    )
                    'z0
                )

                (shift 'x 'x1)
                (shift 'x1 'x2)
                (shift 'x2 'x3)
                (shift 'x3 'x4)
                (shift 'x4 'x5)
                (shift 'x5 'x6)
                (shift 'x6 'x7)
                (shift 'x7 'x8)
                (shift 'x8 'x9)
                (shift 'x9 'x10)
                (shift 'x10 'x11)
                (shift 'x11 'x12)
                (shift 'x12 'x13)
                (shift 'x13 'x14)

                (cond-add 'y15 'x1 'z0 'z1 ')
                (cond-add 'y14 'x2 'z1 'z2 ')
                (cond-add 'y13 'x3 'z2 'z3 ')
                (cond-add 'y12 'x4 'z3 'z4 ')
                (cond-add 'y11 'x5 'z4 'z5 ')
                (cond-add 'y10 'x6 'z5 'z6 ')
                (cond-add 'y9 'x7 'z6 'z7 ')
                (cond-add 'y8 'x8 'z7 'z8 ')
                (cond-add 'y7 'x9 'z8 'z9 ')
                (cond-add 'y6 'x10 'z9 'z10 ')
                (cond-add 'y5 'x11 'z10 'z11 ')
                (cond-add 'y4 'x12 'z11 'z12 ')
                (cond-add 'y3 'x13 'z12 'z ')
            end
            `,
            [
                {
                    'query': `( 
                        (float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0)
                        *
                        (float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0)
                        =
                        'z
                    )`,
                    results: [
                        "@(@(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) * @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) = @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0))"
                    ]
                },
                {
                    'query': `( 
                        (float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0)
                        *
                        (float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0)
                        =
                        'z
                    )`,
                    results: [
                        "@(add @(float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 1 0 0 . 0 0 0 0 0 0 0 0) @(@(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 1 1 0 1) @(adder 1 0 1 0 1) @(adder 1 0 0 1 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0)))"
                    ]
                },
                /*
                {
                    'query': `(if 'x
                        (float16 
                            0 0 0 0 0 0 0 1 . 
                            0 0 0 0 0 0 0 0
                        )
                        (float16 
                            0 0 0 0 0 0 0 0 . 
                            0 0 0 0 0 0 0 0
                        )
                        'z
                    )`, 
                    results: [
                        "@(if 0 @(float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 0 0 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 0 0 . 0 0 0 0 0 0 0 0))",
                        "@(if 1 @(float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 0 0 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0))"
                    ]
                },
                {   
                    query:`
                        (cond-add 'c 
                            (float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0) 
                            (float16 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0) 'x '
                        )`,
                    results: [
                        '@(cond-add 0 @(float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0) \'_v1)',
                        '@(cond-add 1 @(float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 1 0 0 . 0 0 0 0 0 0 0 0) @(add @(float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 1 0 0 . 0 0 0 0 0 0 0 0) @(@(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 1 1 0 1) @(adder 1 0 1 0 1) @(adder 1 0 0 1 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0))))'
                      ]
                },
                /*
                {
                    'query': `
                        (mul 
                            (float16 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 1 1) 
                            (float16 0 0 0 0 0 0 1 0 . 0 0 0 0 0 0 0 1)
                            'z
                            '
                        )
                    `,
                    results: [
                        "NOT WORKING! BAD RESULTS!"
                    ]
                }*/

            ],
            {path: 'dbs/math/5', timeout: 1000 * 60 * 60}
        )
    )

    xit("Mul Floats",
        test(`
            (float32 
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
                . 
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
            )
                        
            #     Cin   A   B   S   Cout
            (adder 0    0   0   0    0)
            (adder 1    0   0   1    0)
            (adder 0    0   1   1    0)
            (adder 1    0   1   0    1)
            (adder 0    1   0   1    0)
            (adder 1    1   0   0    1)
            (adder 0    1   1   0    1)
            (adder 1    1   1   1    1)
            
            (step1 
                (float32
                    'x1 'x2 'x3 'x4 'x5 'x6 'x7 'x8  
                    'x9 'x10 'x11 'x12 'x13 'x14 'x15 'x16 
                    .
                    'x17 'x18 'x19 'x20 'x21 'x22 'x23 'x24  
                    'x25 'x26 'x27 'x28 'x29 'x30 'x31 'x32 
                )
                (float32
                    'x1 'x2 'x3 'x4 'x5 'x6 'x7 'x8  
                    'x9 'x10 'x11 'x12 'x13 'x14 'x15 'x16 
                    .
                    0 0 0 0 0 0 0 0  
                    0 0 0 0 0 0 0 0  
                )
                (float32
                    'x17 'x18 'x19 'x20 'x21 'x22 'x23 'x24  
                    'x25 'x26 'x27 'x28 'x29 'x30 'x31 'x32 
                    .
                    0 0 0 0 0 0 0 0  
                    0 0 0 0 0 0 0 0  
                )
            )

            (
                (float32
                    'x1 'x2 'x3 'x4 'x5 'x6 'x7 'x8  
                    'x9 'x10 'x11 'x12 'x13 'x14 'x15 'x16 
                    .
                    'x17 'x18 'x19 'x20 'x21 'x22 'x23 'x24  
                    'x25 'x26 'x27 'x28 'x29 'x30 'x31 'x32 
                )
                +
                (float32
                    'y1 'y2 'y3 'y4 'y5 'y6 'y7 'y8  
                    'y9 'y10 'y11 'y12 'y13 'y14 'y15 'y16 
                    .
                    'y17 'y18 'y19 'y20 'y21 'y22 'y23 'y24  
                    'y25 'y26 'y27 'y28 'y29 'y30 'y31 'y32 
                )
                =
                (float32
                    'z1 'z2 'z3 'z4 'z5 'z6 'z7 'z8  
                    'z9 'z10 'z11 'z12 'z13 'z14 'z15 'z16 
                    .
                    'z17 'z18 'z19 'z20 'z21 'z22 'z23 'z24  
                    'z25 'z26 'z27 'z28 'z29 'z30 'z31 'z32 
                )
            ) where
                (adder 0    'x32 'y32 'z32 'c1)
                (adder 'c1  'x31 'y31 'z31 'c2)
                (adder 'c2  'x30 'y30 'z30 'c3)
                (adder 'c3  'x29 'y29 'z29 'c4)
                (adder 'c4  'x28 'y28 'z28 'c5)
                (adder 'c5  'x27 'y27 'z27 'c6)
                (adder 'c6  'x26 'y26 'z26 'c7)
                (adder 'c7  'x25 'y25 'z25 'c8)
                (adder 'c8  'x24 'y24 'z24 'c9)
                (adder 'c9  'x23 'y23 'z23 'c10)
                (adder 'c10 'x22 'y22 'z22 'c11)
                (adder 'c11 'x21 'y21 'z21 'c12)
                (adder 'c12 'x20 'y20 'z20 'c13)
                (adder 'c13 'x19 'y19 'z19 'c14)
                (adder 'c14 'x18 'y18 'z18 'c15)
                (adder 'c15 'x17 'y17 'z17 'c16)
                (adder 'c16 'x16 'y16 'z16 'c17)
                (adder 'c17 'x15 'y15 'z15 'c18)
                (adder 'c18 'x14 'y14 'z14 'c19)
                (adder 'c19 'x13 'y13 'z13 'c20)
                (adder 'c20 'x12 'y12 'z12 'c21)
                (adder 'c21 'x11 'y11 'z11 'c22)
                (adder 'c22 'x10 'y10 'z10 'c23)
                (adder 'c23 'x9  'y9  'z9 'c24)
                (adder 'c24 'x8  'y8  'z8 'c25)
                (adder 'c25 'x7  'y7  'z7 'c26)
                (adder 'c26 'x6  'y6  'z6 'c27)
                (adder 'c27 'x5  'y5  'z5 'c28)
                (adder 'c28 'x4  'y4  'z4 'c29)
                (adder 'c29 'x3  'y3  'z3 'c30)
                (adder 'c30 'x2  'y2  'z2 'c31)
                (adder 'c31 'x1  'y1  'z1 'z0)
            end

            (shift 
                (float32
                    'y1 'y2 'y3 'y4 'y5 'y6 'y7 'y8  
                    'y9 'y10 'y11 'y12 'y13 'y14 'y15 'y16 
                    .
                    'y17 'y18 'y19 'y20 'y21 'y22 'y23 'y24  
                    'y25 'y26 'y27 'y28 'y29 'y30 'y31 'y32 
                )
                (float32
                    'y2 'y3 'y4 'y5 'y6 'y7 'y8  
                    'y9 'y10 'y11 'y12 'y13 'y14 'y15 'y16 'y17
                    .
                    'y18 'y19 'y20 'y21 'y22 'y23 'y24  
                    'y25 'y26 'y27 'y28 'y29 'y30 'y31 'y32 0
                )
            )

            (cond-add 1 'x 'y 'z ('x + 'y = 'z))
            (cond-add 0 'x 'y 'y ')
            (if 1 'x 'y 'x )
            (if 0 'x 'y 'y )

            (
                'x
                **
                (float32
                    'y1 'y2 'y3 'y4 'y5 'y6 'y7 'y8  
                    'y9 'y10 'y11 'y12 'y13 'y14 'y15 'y16 
                    .
                    'y17 'y18 'y19 'y20 'y21 'y22 'y23 'y24  
                    'y25 'y26 'y27 'y28 'y29 'y30 'y31 'y32 
                )
                =
                'z
            ) where
                (if 'y16 'x  
                    (float32
                        0 0 0 0 0 0 0 0 
                        0 0 0 0 0 0 0 0
                        .
                        0 0 0 0 0 0 0 0 
                        0 0 0 0 0 0 0 0
                    )
                    'z0
                )

                (shift 'x 'x1)
                (shift 'x1 'x2)
                (shift 'x2 'x3)
                (shift 'x3 'x4)
                (shift 'x4 'x5)
                (shift 'x5 'x6)
                (shift 'x6 'x7)
                (shift 'x7 'x8)
                (shift 'x8 'x9)
                (shift 'x9 'x10)
                (shift 'x10 'x11)
                (shift 'x11 'x12)
                (shift 'x12 'x13)
                (shift 'x13 'x14)

                (cond-add 'y15 'x1 'z0 'z1 ')
                (cond-add 'y14 'x2 'z1 'z2 ')
                (cond-add 'y13 'x3 'z2 'z3 ')
                (cond-add 'y12 'x4 'z3 'z4 ')
                (cond-add 'y11 'x5 'z4 'z5 ')
                (cond-add 'y10 'x6 'z5 'z6 ')
                (cond-add 'y9 'x7 'z6 'z7 ')
                (cond-add 'y8 'x8 'z7 'z8 ')
                (cond-add 'y7 'x9 'z8 'z9 ')
                (cond-add 'y6 'x10 'z9 'z10 ')
                (cond-add 'y5 'x11 'z10 'z11 ')
                (cond-add 'y4 'x12 'z11 'z12 ')
                (cond-add 'y3 'x13 'z12 'z ')
            end

            (join
                (float32
                    'y1 'y2 'y3 'y4 'y5 'y6 'y7 'y8  
                    'y9 'y10 'y11 'y12 'y13 'y14 'y15 'y16 
                    .
                    0 0 0 0 0 0 0 0 
                    0 0 0 0 0 0 0 0
                )
                (float32
                    'y17 'y18 'y19 'y20 'y21 'y22 'y23 'y24  
                    'y25 'y26 'y27 'y28 'y29 'y30 'y31 'y32 
                    .
                    0 0 0 0 0 0 0 0 
                    0 0 0 0 0 0 0 0
                )
                (float32
                    'y1 'y2 'y3 'y4 'y5 'y6 'y7 'y8  
                    'y9 'y10 'y11 'y12 'y13 'y14 'y15 'y16 
                    .
                    'y17 'y18 'y19 'y20 'y21 'y22 'y23 'y24  
                    'y25 'y26 'y27 'y28 'y29 'y30 'y31 'y32 
                )
            )
            
            (
                'x
                *
                'y
                =
                'z
            ) where
                (step1 'x 'xi 'xf)
                (step1 'y 'yi 'yf)
                ('xi ** 'yf = 'a)
                ('xf ** 'yi = 'b)
                (join 'a 'b 'z)
            end
            `,
            [
                /*{
                    'query': `( 
                        (float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0)
                        *
                        (float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0)
                        =
                        'z
                    )`,
                    results: [
                        "@(@(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) * @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) = @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0))"
                    ]
                },
                {
                    'query': `( 
                        (float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0)
                        *
                        (float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0)
                        =
                        'z
                    )`,
                    results: [
                        "@(@(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) * @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) = @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0))"
                    ]
                },
                {
                    'query': `( 
                        (float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0)
                        *
                        (float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0)
                        =
                        'z
                    )`,
                    results: [
                        "@(@(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0) * @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) = @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 0 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0))"
                    ]
                },*/
                {
                    'query': `( 
                        (float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 . 1 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0)
                        *
                        (float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0)
                        =
                        'z 
                    )`,
                    results: [
                        "@(@(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) * @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) = @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0))"
                    ]
                },
                /*
                {
                    'query': `(if 'x
                        (float16 
                            0 0 0 0 0 0 0 1 . 
                            0 0 0 0 0 0 0 0
                        )
                        (float16 
                            0 0 0 0 0 0 0 0 . 
                            0 0 0 0 0 0 0 0
                        )
                        'z
                    )`, 
                    results: [
                        "@(if 0 @(float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 0 0 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 0 0 . 0 0 0 0 0 0 0 0))",
                        "@(if 1 @(float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 0 0 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0))"
                    ]
                },
                {   
                    query:`
                        (cond-add 'c 
                            (float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0) 
                            (float16 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0) 'x '
                        )`,
                    results: [
                        '@(cond-add 0 @(float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0) \'_v1)',
                        '@(cond-add 1 @(float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 1 0 0 . 0 0 0 0 0 0 0 0) @(add @(float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 1 0 0 . 0 0 0 0 0 0 0 0) @(@(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 1 1 0 1) @(adder 1 0 1 0 1) @(adder 1 0 0 1 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0))))'
                    ]
                },
                /*
                {
                    'query': `
                        (mul 
                            (float16 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 1 1) 
                            (float16 0 0 0 0 0 0 1 0 . 0 0 0 0 0 0 0 1)
                            'z
                            '
                        )
                    `,
                    results: [
                        "NOT WORKING! BAD RESULTS!"
                    ]
                }*/

            ],
            {path: 'dbs/math/5', timeout: 1000 * 60 * 60}
        )
    )

    xit("Mul Floats",
        test(`
            (float32 
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
                . 
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
                '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} '{0 1} /* 8 bits */
            )
            
            ('x = 'x)
            #     Cin   A   B   S   Cout
            (adder 0    0   0   0    0)
            (adder 1    0   0   1    0)
            (adder 0    0   1   1    0)
            (adder 1    0   1   0    1)
            (adder 0    1   0   1    0)
            (adder 1    1   0   0    1)
            (adder 0    1   1   0    1)
            (adder 1    1   1   1    1)
            
            (
                (float32
                    'x1 'x2 'x3 'x4 'x5 'x6 'x7 'x8  
                    'x9 'x10 'x11 'x12 'x13 'x14 'x15 'x16 
                    .
                    'x17 'x18 'x19 'x20 'x21 'x22 'x23 'x24  
                    'x25 'x26 'x27 'x28 'x29 'x30 'x31 'x32 
                )
                +
                (float32
                    'y1 'y2 'y3 'y4 'y5 'y6 'y7 'y8  
                    'y9 'y10 'y11 'y12 'y13 'y14 'y15 'y16 
                    .
                    'y17 'y18 'y19 'y20 'y21 'y22 'y23 'y24  
                    'y25 'y26 'y27 'y28 'y29 'y30 'y31 'y32 
                )
                =
                (float32
                    'z1 'z2 'z3 'z4 'z5 'z6 'z7 'z8  
                    'z9 'z10 'z11 'z12 'z13 'z14 'z15 'z16 
                    .
                    'z17 'z18 'z19 'z20 'z21 'z22 'z23 'z24  
                    'z25 'z26 'z27 'z28 'z29 'z30 'z31 'z32 
                )
            ) {
                (adder 0    'x32 'y32 'z32 'c1)
                (adder 'c1  'x31 'y31 'z31 'c2)
                (adder 'c2  'x30 'y30 'z30 'c3)
                (adder 'c3  'x29 'y29 'z29 'c4)
                (adder 'c4  'x28 'y28 'z28 'c5)
                (adder 'c5  'x27 'y27 'z27 'c6)
                (adder 'c6  'x26 'y26 'z26 'c7)
                (adder 'c7  'x25 'y25 'z25 'c8)
                (adder 'c8  'x24 'y24 'z24 'c9)
                (adder 'c9  'x23 'y23 'z23 'c10)
                (adder 'c10 'x22 'y22 'z22 'c11)
                (adder 'c11 'x21 'y21 'z21 'c12)
                (adder 'c12 'x20 'y20 'z20 'c13)
                (adder 'c13 'x19 'y19 'z19 'c14)
                (adder 'c14 'x18 'y18 'z18 'c15)
                (adder 'c15 'x17 'y17 'z17 'c16)
                (adder 'c16 'x16 'y16 'z16 'c17)
                (adder 'c17 'x15 'y15 'z15 'c18)
                (adder 'c18 'x14 'y14 'z14 'c19)
                (adder 'c19 'x13 'y13 'z13 'c20)
                (adder 'c20 'x12 'y12 'z12 'c21)
                (adder 'c21 'x11 'y11 'z11 'c22)
                (adder 'c22 'x10 'y10 'z10 'c23)
                (adder 'c23 'x9  'y9  'z9 'c24)
                (adder 'c24 'x8  'y8  'z8 'c25)
                (adder 'c25 'x7  'y7  'z7 'c26)
                (adder 'c26 'x6  'y6  'z6 'c27)
                (adder 'c27 'x5  'y5  'z5 'c28)
                (adder 'c28 'x4  'y4  'z4 'c29)
                (adder 'c29 'x3  'y3  'z3 'c30)
                (adder 'c30 'x2  'y2  'z2 'c31)
                (adder 'c31 'x1  'y1  'z1 'z0)
            }

            (shift 
                (float32
                    'y1 'y2 'y3 'y4 'y5 'y6 'y7 'y8  
                    'y9 'y10 'y11 'y12 'y13 'y14 'y15 'y16 
                    .
                    'y17 'y18 'y19 'y20 'y21 'y22 'y23 'y24  
                    'y25 'y26 'y27 'y28 'y29 'y30 'y31 'y32 
                )
                (float32
                    'y2 'y3 'y4 'y5 'y6 'y7 'y8  
                    'y9 'y10 'y11 'y12 'y13 'y14 'y15 'y16 'y17
                    .
                    'y18 'y19 'y20 'y21 'y22 'y23 'y24  
                    'y25 'y26 'y27 'y28 'y29 'y30 'y31 'y32 0
                )
            )

            (cond-add 1 'x 'y 'z ('x + 'y = 'z))
            (cond-add 0 'x 'y 'y ')
            (if 1 'x 'y 'x )
            (if 0 'x 'y 'y )

            (
                'x
                **
                (float32
                    'y1 'y2 'y3 'y4 'y5 'y6 'y7 'y8  
                    'y9 'y10 'y11 'y12 'y13 'y14 'y15 'y16 
                    .
                    'y17 'y18 'y19 'y20 'y21 'y22 'y23 'y24  
                    'y25 'y26 'y27 'y28 'y29 'y30 'y31 'y32 
                )
                =
                'z
            ) {
                (if 'y32 'x  
                    (float32
                        0 0 0 0 0 0 0 0 
                        0 0 0 0 0 0 0 0
                        .
                        0 0 0 0 0 0 0 0 
                        0 0 0 0 0 0 0 0
                    )
                    'z0
                )

                (shift 'x 'x1)
                (shift 'x1 'x2)
                (shift 'x2 'x3)
                (shift 'x3 'x4)
                (shift 'x4 'x5)
                (shift 'x5 'x6)
                (shift 'x6 'x7)
                (shift 'x7 'x8)
                (shift 'x8 'x9)
                (shift 'x9 'x10)
                (shift 'x10 'x11)
                (shift 'x11 'x12)
                (shift 'x12 'x13)
                (shift 'x13 'x14)

                (cond-add 'y31 'x1 'z0 'z1 ')
                (cond-add 'y30 'x2 'z1 'z2 ')
                (cond-add 'y29 'x3 'z2 'z3 ')
                (cond-add 'y28 'x4 'z3 'z4 ')
                (cond-add 'y27 'x5 'z4 'z5 ')
                (cond-add 'y26 'x6 'z5 'z6 ')
                (cond-add 'y25 'x7 'z6 'z7 ')
                (cond-add 'y24 'x8 'z7 'z8 ')
                (cond-add 'y23 'x9 'z8 'z9 ')
                (cond-add 'y22 'x10 'z9 'z10 ')
                (cond-add 'y21 'x11 'z10 'z11 ')
                (cond-add 'y20 'x12 'z11 'z12 ')
                (cond-add 'y19 'x13 'z12 'z ')
            }

            (
                'x~(float32
                    0 0 0 0 0 0 0 0  
                    0 0 0 0 0 0 0 0  
                    .
                    0 0 0 0 0 0 0 0  
                    0 0 0 0 0 0 0 0  
                )
                *
                'y~(float32
                    0 0 0 0 0 0 0 0  
                    0 0 0 0 0 0 0 0  
                    .
                    0 0 0 0 0 0 0 0  
                    0 0 0 0 0 0 0 0  
                )
                =
                'r
            ) {
                ('x = (float32
                    'x1 'x2 'x3 'x4 'x5 'x6 'x7 'x8  
                    'x9 'x10 'x11 'x12 'x13 'x14 'x15 'x16 
                    .
                    'x17 'x18 'x19 'x20 'x21 'x22 'x23 'x24  
                    'x25 'x26 'x27 'x28 'x29 'x30 'x31 0 
                ))

                ('y = (float32
                    'y1 'y2 'y3 'y4 'y5 'y6 'y7 'y8  
                    'y9 'y10 'y11 'y12 'y13 'y14 'y15 'y16 
                    .
                    'y17 'y18 'y19 'y20 'y21 'y22 'y23 'y24  
                    'y25 'y26 'y27 'y28 'y29 'y30 'y31 0 
                ))

                ( 
                    (float32
                        'x1 'x1 'x2 'x3 'x4 'x5 'x6 'x7  
                        'x8 'x9 'x10 'x11 'x12 'x13 'x14 'x15 
                        .
                        'x16 'x17 'x18 'x19 'x20 'x21 'x22 'x23  
                        'x24 'x25 'x26 'x27 'x28 'x29 'x30 'x31 
                    )
                    * 
                    (float32
                        'y1 'y1 'y2 'y3 'y4 'y5 'y6 'y7  
                        'y8 'y9 'y10 'y11 'y12 'y13 'y14 'y15  
                        .
                        'y16 'y17 'y18 'y19 'y20 'y21 'y22 'y23  
                        'y24 'y25 'y26 'y27 'y28 'y29 'y30 'y31 
                    )
                    = 'a
                )

                (shift 'a 'r)
            }

            ('x * 'y = 'r) {
                ('x = (float32
                    'x1 'x2 'x3 'x4 'x5 'x6 'x7 'x8  
                    'x9 'x10 'x11 'x12 'x13 'x14 'x15 'x16 
                    .
                    'x17 'x18 'x19 'x20 'x21 'x22 'x23 'x24  
                    'x25 'x26 'x27 'x28 'x29 'x30 'x31 'x32
                ))

                ('y = (float32
                    'y1 'y2 'y3 'y4 'y5 'y6 'y7 'y8  
                    'y9 'y10 'y11 'y12 'y13 'y14 'y15 'y16 
                    .
                    'y17 'y18 'y19 'y20 'y21 'y22 'y23 'y24  
                    'y25 'y26 'y27 'y28 'y29 'y30 'y31 ~'x32 
                ))

                ('x ** 'y = 'r)
            }

            ('x * 'y = 'r) {
                ('x = (float32
                    'x1 'x2 'x3 'x4 'x5 'x6 'x7 'x8  
                    'x9 'x10 'x11 'x12 'x13 'x14 'x15 'x16 
                    .
                    'x17 'x18 'x19 'x20 'x21 'x22 'x23 'x24  
                    'x25 'x26 'x27 'x28 'x29 'x30 'x31 1
                ))

                ('y = (float32
                    'y1 'y2 'y3 'y4 'y5 'y6 'y7 'y8  
                    'y9 'y10 'y11 'y12 'y13 'y14 'y15 'y16 
                    .
                    'y17 'y18 'y19 'y20 'y21 'y22 'y23 'y24  
                    'y25 'y26 'y27 'y28 'y29 'y30 'y31 1 
                ))

                ('x ** 'y = 'r)
            }

            `,
            [
                {
                    'query': `( 
                        (float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 . 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0)
                        *
                        (float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 . 0 0 0 0 0 0 0 0 0 0 0 0 1 1 0 0)
                        =
                        'z
                    )`,
                    results: [
                        "@(@(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) * @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) = @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0))"
                    ]
                },
                /*{
                    'query': `( 
                        (float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0)
                        *
                        (float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0)
                        =
                        'z
                    )`,
                    results: [
                        "@(@(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) * @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) = @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0))"
                    ]
                },
                {
                    'query': `( 
                        (float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0)
                        *
                        (float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0)
                        =
                        'z
                    )`,
                    results: [
                        "@(@(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0) * @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) = @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 0 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0))"
                    ]
                },
                {
                    'query': `( 
                        (float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 . 1 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0)
                        *
                        (float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0)
                        =
                        'z 
                    )`,
                    results: [
                        "@(@(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) * @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0) = @(float32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0))"
                    ]
                },
                {
                    'query': `(if 'x
                        (float16 
                            0 0 0 0 0 0 0 1 . 
                            0 0 0 0 0 0 0 0
                        )
                        (float16 
                            0 0 0 0 0 0 0 0 . 
                            0 0 0 0 0 0 0 0
                        )
                        'z
                    )`, 
                    results: [
                        "@(if 0 @(float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 0 0 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 0 0 . 0 0 0 0 0 0 0 0))",
                        "@(if 1 @(float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 0 0 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0))"
                    ]
                },
                {   
                    query:`
                        (cond-add 'c 
                            (float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0) 
                            (float16 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0) 'x '
                        )`,
                    results: [
                        '@(cond-add 0 @(float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0) \'_v1)',
                        '@(cond-add 1 @(float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 1 0 0 . 0 0 0 0 0 0 0 0) @(add @(float16 0 0 0 0 0 0 0 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 0 0) @(float16 0 0 0 0 0 1 0 0 . 0 0 0 0 0 0 0 0) @(@(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 1 1 0 1) @(adder 1 0 1 0 1) @(adder 1 0 0 1 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0) @(adder 0 0 0 0 0))))'
                    ]
                },
                {
                    'query': `
                        (mul 
                            (float16 0 0 0 0 0 0 1 1 . 0 0 0 0 0 0 1 1) 
                            (float16 0 0 0 0 0 0 1 0 . 0 0 0 0 0 0 0 1)
                            'z
                            '
                        )
                    `,
                    results: [
                        "NOT WORKING! BAD RESULTS!"
                    ]
                }*/
            ],
            {path: 'dbs/math/5', timeout: 1000 * 60 * 60}
        )
    )

    // x^5 + x^4 - 10x^3 - 10x^2 + 5x + 5 = 0

    // TODO: make a variables only multiple, to test optimization ? 
})

