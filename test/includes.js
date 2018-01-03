"use strict";

const {test} = require("../");

describe("Include tests.", function () {
	it("Should include simple file",
		test(
			`[list]
            ?(list)`,

			`?(list):
                @(list)`, {
				files: {
					"list": {
						data: "(list)"
					}
				}
			}
		)
	);

	it("Should include duplicated file",
		test(
			`[list] [list]
            ?(list)`,

			`?(list):
                @(list)`, {
				files: {
					"list": {
						data: "(list)"
					}
				}
			}
		)
	);
});
