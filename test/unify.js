var should = require("should");
var unify = require("../lib/unify");
var Writer = require("../lib/writer");

describe('Test Unify Operation.', function() {
    it("Should unify with terms unify list, constant with not's.", function() {
        var s = {
            "p": {
                "data": [{
                    "type": "ignore"
                }, {
                    "type": "tuple",
                    "check": true,
                    "data": [
                        2,
                        3,
                        6,
                        18
                    ]
                }, {
                    "type": "constant",
                    "data": "set"
                }, {
                    "type": "tuple",
                    "check": true,
                    "data": [
                        4,
                        5
                    ]
                }, {
                    "type": "constant",
                    "data": "number"
                }, {
                    "type": "constant",
                    "data": "0"
                }, {
                    "type": "tuple",
                    "check": true,
                    "data": [
                        2,
                        7,
                        9,
                        15
                    ]
                }, {
                    "type": "tuple",
                    "check": true,
                    "data": [
                        4,
                        8
                    ]
                }, {
                    "type": "constant",
                    "data": "1"
                }, {
                    "type": "tuple",
                    "data": [
                        2,
                        10,
                        13,
                        14
                    ]
                }, {
                    "type": "tuple",
                    "data": [
                        4,
                        11
                    ]
                }, {
                    "type": "not",
                    "data": 8,
                    "unify": [
                        12
                    ]
                }, {
                    "type": "not",
                    "data": 5,
                    "unify": [
                        11
                    ]
                }, {
                    "type": "variable",
                    "data": "tail"
                }, {
                    "type": "variable"
                }, {
                    "type": "tuple",
                    "data": [
                        2,
                        16,
                        13,
                        17
                    ]
                }, {
                    "type": "tuple",
                    "data": [
                        4,
                        8
                    ]
                }, {
                    "type": "variable"
                }, {
                    "type": "tuple",
                    "check": true,
                    "data": [
                        2,
                        19,
                        9,
                        20
                    ]
                }, {
                    "type": "tuple",
                    "check": true,
                    "data": [
                        4,
                        5
                    ]
                }, {
                    "type": "tuple",
                    "data": [
                        2,
                        21,
                        13,
                        22
                    ]
                }, {
                    "type": "tuple",
                    "data": [
                        4,
                        5
                    ]
                }, {
                    "type": "variable"
                }],
                "start": 1
            },
            "q": {
                "data": [{
                    "type": "ignore"
                }, {
                    "type": "tuple",
                    "data": [
                        2,
                        3
                    ]
                }, {
                    "type": "constant",
                    "data": "number"
                }, {
                    "type": "constant",
                    "data": "2"
                }],
                "start": 1
            },
            "writePointer": 27,
            "write": {
                "4": {
                    "type": "constant",
                    "data": "number"
                },
                "5": {
                    "type": "constant",
                    "data": "0"
                },
                "8": {
                    "type": "constant",
                    "data": "1"
                },
                "10": {
                    "type": "tuple",
                    "data": [
                        4,
                        11
                    ],
                    "check": true
                },
                "11": {
                    "type": "not",
                    "data": 8,
                    "unify": [
                        12
                    ]
                },
                "12": {
                    "type": "not",
                    "data": 5,
                    "unify": [
                        11
                    ]
                },
                "24": {
                    "type": "tuple",
                    "data": [
                        25,
                        26
                    ]
                },
                "25": {
                    "type": "constant",
                    "data": "number"
                },
                "26": {
                    "type": "constant",
                    "data": "2"
                }
            }
        };

        var w = Writer.load(s);
        should(w.snapshot()).eql(s);

        should(unify(w, 26, 11)).eql(11);

        should(w.snapshot()).eql({
            "p": {
                "data": [{
                    "type": "ignore"
                }, {
                    "type": "tuple",
                    "check": true,
                    "data": [2, 3, 6, 18]
                }, {
                    "type": "constant",
                    "data": "set"
                }, {
                    "type": "tuple",
                    "check": true,
                    "data": [4, 5]
                }, {
                    "type": "constant",
                    "data": "number"
                }, {
                    "type": "constant",
                    "data": "0"
                }, {
                    "type": "tuple",
                    "check": true,
                    "data": [2, 7, 9, 15]
                }, {
                    "type": "tuple",
                    "check": true,
                    "data": [4, 8]
                }, {
                    "type": "constant",
                    "data": "1"
                }, {
                    "type": "tuple",
                    "data": [2, 10, 13, 14]
                }, {
                    "type": "tuple",
                    "data": [4, 11]
                }, {
                    "type": "not",
                    "data": 8,
                    "unify": [12]
                }, {
                    "type": "not",
                    "data": 5,
                    "unify": [11]
                }, {
                    "type": "variable",
                    "data": "tail"
                }, {
                    "type": "variable"
                }, {
                    "type": "tuple",
                    "data": [2, 16, 13, 17]
                }, {
                    "type": "tuple",
                    "data": [4, 8]
                }, {
                    "type": "variable"
                }, {
                    "type": "tuple",
                    "check": true,
                    "data": [2, 19, 9, 20]
                }, {
                    "type": "tuple",
                    "check": true,
                    "data": [4, 5]
                }, {
                    "type": "tuple",
                    "data": [2, 21, 13, 22]
                }, {
                    "type": "tuple",
                    "data": [4, 5]
                }, {
                    "type": "variable"
                }],
                "start": 1
            },
            "q": {
                "data": [{
                    "type": "ignore"
                }, {
                    "type": "tuple",
                    "data": [2, 3]
                }, {
                    "type": "constant",
                    "data": "number"
                }, {
                    "type": "constant",
                    "data": "2"
                }],
                "start": 1
            },
            "writePointer": 27,
            "write": {
                "4": {
                    "type": "constant",
                    "data": "number"
                },
                "5": {
                    "type": "constant",
                    "data": "0"
                },
                "8": {
                    "type": "constant",
                    "data": "1"
                },
                "10": {
                    "type": "tuple",
                    "data": [4, 11],
                    "check": true
                },
                "11": {
                    "type": "defer",
                    "data": 26
                },
                "12": {
                    "type": "defer",
                    "data": 26
                },
                "24": {
                    "type": "tuple",
                    "data": [25, 26]
                },
                "25": {
                    "type": "constant",
                    "data": "number"
                },
                "26": {
                    "type": "constant",
                    "data": "2"
                }
            }
        });
    });
});
