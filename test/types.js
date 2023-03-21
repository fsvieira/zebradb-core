"use strict";

const test = require("../test-utils/test");

describe("Types Tests.", () => {
	it("should types",
		test(
            `
            (* : int -> int -> int ')
            (* : int -> real -> real ')
            (* : real -> int -> real ')
            (* : real -> real -> real ')

            (+ : int -> int -> int ')
            (+ : int -> real -> real ')
            (+ : real -> int -> real ')
            (+ : real -> real -> real ')

            (+ : string -> int ')
            (+ : string -> real ')
            (+ : int -> int ')
            (+ : real -> real ')

            (- : int -> int -> int ')
            (- : int -> real -> real ')
            (- : real -> int -> real ')
            (- : real -> real -> real ')

            (/ : int -> int -> real ')
            (/ : int -> real -> real ')
            (/ : real -> int -> real ')
            (/ : real -> real -> real ')

            ('x : 'y ')
            `,
            [
                {
                    query: `(* : int -> 'x -> real ')`,
                    results: [
                        "@(* : int -> real -> real 'v$2)"
                    ]
                },
                {
                    query: `
                        (x : 'tx (y : 'ty
                            (* : 'tx -> 'ty -> ' ')
                        ))
                    `,
                    results: [
                        "@(x : int @(y : int @(* : int -> int -> int 'v$5)))",
                        "@(x : int @(y : real @(* : int -> real -> real 'v$5)))",
                        "@(x : real @(y : int @(* : real -> int -> real 'v$5)))",
                        "@(x : real @(y : real @(* : real -> real -> real 'v$5)))"
                    ]
                },
                {
                    // x * y / int
                    query: `
                        (fn : 'r (x : 'tx (y : 'ty
                            (* : 'tx -> 'ty -> 'a (/ : 'a -> int -> 'r '))
                        )))
                    `,
                    process: tuple => {
                        const toString = v => {
                            if (v.v) {
                                return `'${v.v}`
                            }
                            else if (v.c) {
                                return v.c;
                            }
                            else if (v.t) {
                                return `(${v.t.map(toString).join(" ")})`;
                            }
                            else {
                                return '#error#'
                            }
                        }

                        const toList = ({t}) => {
                            if (t && t.length === 4) {
                                const y = t[2];
                                const r = t[3];

                                return toString(y) + (r.t?` -> ${toList(r)}`:"")
                            }
                            
                            return "";
                        }

                        const fn = ({t: [fn, v1, fnt, args]}) => `${toString(fn)}: ${toList(args)}${toString(fnt)}`;

                        return fn(tuple);
                    },
                    results: [
                        "fn: int -> int -> real",
                        "fn: int -> real -> real",
                        "fn: real -> int -> real",
                        "fn: real -> real -> real"
                    ]
                }
            ],
            {
                timeout: 1000 * 60,
                path: 'dbs/types/1.db'
			}
        )
    )
});
