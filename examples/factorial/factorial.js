var should = require("should");
var Z = require("../../lib/z");
var ZQuery = require("../../lib/zquery");
var D = require("../../lib/zquery_debug");

var run;
            
run = new ZQuery.Run(
                Z.d(
                    Z.t(Z.c("nat"), Z.c("0")),
                    Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.v("n"))),
    
                    // a . 0 = a,                
                    Z.t(
                        Z.c("add"),
                        Z.t(Z.c("nat"), Z.v("a")), // a 
                        Z.t(Z.c("nat"), Z.c("0")), // 0
                        Z.t(Z.c("nat"), Z.v("a")), // a + 0 = a
                        Z.v()
                    ),
                    
                    // a . S(b) = a + (a . b)
                    Z.t(
                        Z.c("add"),
                        Z.t(Z.c("nat"), Z.v("a")), // a 
                        Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.v("b"))), // S(b)
                        Z.t(Z.c("nat"), Z.v("r")), // r = a + 1 + r
                        Z.t(
                            Z.c("add"), 
                            Z.t(Z.c("nat"), Z.v("a")),
                            Z.t(Z.c("nat"), Z.v("b")),
                            Z.v("r"),
                            Z.v()
                        )
                    ),

                    // List
                    Z.t(Z.c("list")), // empty list,
                    Z.t(Z.c("list"), Z.v("item"), Z.t(Z.c("list"), Z.v(), Z.v())),
                    Z.t(Z.c("list"), Z.v("item"), Z.t(Z.c("list"))),
                    
                    // a . 0 = 0
                    Z.t(
                        Z.c("mul"),
                        Z.t(Z.c("nat"), Z.v("a")), // a 
                        Z.t(Z.c("nat"), Z.c("0")), // 0
                        Z.t(Z.c("nat"), Z.c("0")), // 0
                        Z.v()
                    ),
                    
                    // a . S(b) = a + (a . b)
                    Z.t(
                        Z.c("mul"),
                        Z.t(Z.c("nat"), Z.v("a")),  // a 
                        Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.v("b"))), // S(b)
                        Z.v("r"), // r
                        Z.t(
                            Z.c("list"),
                            Z.t(
                                Z.c("add"),
                                Z.t(Z.c("nat"), Z.v("a")),
                                Z.v("rm"),
                                Z.v("r"),
                                Z.v()
                            ),
                            Z.t(
                                Z.c("list"),
                                Z.t(
                                    Z.c("mul"),
                                    Z.t(Z.c("nat"), Z.v("a")), // a
                                    Z.t(Z.c("nat"), Z.v("b")), // b
                                    Z.v("rm"),
                                    Z.v()
                                ),
                                Z.t(Z.c("list"))
                            )
                        )
                    )
                )
            );

            // 1 * 2 = 2
            /*D.logger (function () {
                should(run.queryArray(
                    Z.t(
                        Z.c("mul"),
                        Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0"))), // 1
                        Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0")))), // 2
                        Z.v("r"), // r
                        Z.v()
                    )
                )).eql([""]);
            }, {
                log: "logs/fac_1_mul_2.json",
                // status: [
                //    "VAR_UNIFY_TRUE",
                //    "TUPLE_UNIFY_TRUE",
                //    "CONST_UNIFY_TRUE"
                // ]
                testcase: "test/gen_fac_1_mul_2.js",
                exceptions: [
                    {
                        "message": "variable unify end: 'a = (nat 0) <=> (nat 'b = 0)",
                        "status": "VAR_UNIFY_FALSE"
                    }
                ]
            });*/
            
            var result = run.queryArray(
                    Z.t(
                        Z.c("mul"),
                        Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0"))), // 1
                        Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.t(Z.c("nat"), Z.c("0")))), // 2
                        Z.v("r"), // r
                        Z.v()
                    )
            );

            console.log(result);


