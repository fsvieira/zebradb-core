const test = require("../lib/testing/test");

describe('Error Tests', function () {
    it('should give an error when definition doens\'t match.',
        test(
            `
            (definition (dont match with anything))
            ?(definition ')
            `
            ,
            ``
        )
    );
});