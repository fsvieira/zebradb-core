"use strict";

const test = require("../test-utils/test");

describe("Basic", () => {
    it("Simple Set", test(`
        $BOOL = {0 1}
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

