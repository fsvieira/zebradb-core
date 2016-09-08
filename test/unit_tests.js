var should = require("should");
var Z = require("../lib/z");

// --- internal ---
var types = require("../lib/types");
var parser = require("../lib/z_parser");
var zparser = require("../lib/zparser");
var Writer = require("../lib/writer");
var unify = require("../lib/unify");

describe('Internal Unit Tests.', function() {

    describe('polyfill.js', function() {
        var r = [1, 2, 3, 4];

        should(r.findIndex(function(i) {
            return i % 2 === 0;
        })).eql(1);

    });

    describe('types.js', function() {
        it('should create variable/v', function() {
            should(types.variable()).eql({
                type: "variable"
            });
            should(types.variable("x")).eql({
                type: "variable",
                data: "x"
            });

            should(types.v()).eql({
                type: "variable"
            });
            should(types.v("x")).eql({
                type: "variable",
                data: "x"
            });
        });

        it('should create constant/c', function() {
            should(types.constant("yellow")).eql({
                type: "constant",
                data: "yellow"
            });
            should(types.c("yellow")).eql({
                type: "constant",
                data: "yellow"
            });
        });

        it('should create tuple/t', function() {

            var ts;

            // empty tuple,
            ts = [];
            should(types.tuple(ts)).eql({
                type: "tuple",
                data: ts
            });

            // constant tuples,
            var red = types.c("red");
            var green = types.c("green");
            var blue = types.c("blue");

            ts = [red];
            should(types.tuple(ts)).eql({
                type: "tuple",
                data: [red]
            });

            ts = [red, green, blue];
            should(types.tuple(ts)).eql({
                type: "tuple",
                data: [red, green, blue]
            });

            // ...

        });

        it('should create ignore/i', function() {
            should(types.ignore()).eql({
                type: "ignore"
            });
            should(types.i()).eql({
                type: "ignore"
            });
        });

        it('should create not/n', function() {
            var red = types.c("red");

            should(types.not(red)).eql({
                type: "not",
                data: red
            });
            should(types.n(red)).eql({
                type: "not",
                data: red
            });
        });
    });

    describe('z_parser.js', function() {
        // TODO: insert this on "it" function
        should(parser.parse("(red green blue)")).eql([{
            data: [{
                data: 'red',
                type: 'constant'
            }, {
                data: 'green',
                type: 'constant'
            }, {
                data: 'blue',
                type: 'constant'
            }],
            type: 'tuple'
        }]);
    });

    describe('zparser.js', function() {
        // TODO: insert this on "it" function
        should(zparser.parse("(red green blue)")).eql({
            definitions: [{
                data: [{
                    data: 'red',
                    type: 'constant'
                }, {
                    data: 'green',
                    type: 'constant'
                }, {
                    data: 'blue',
                    type: 'constant'
                }],
                type: 'tuple'
            }],
            queries: []
        });
    });

    describe('zutils.js', function() {

    });

    describe('cmp.js', function() {

    });

    describe('planner.js', function() {

    });

    describe('unify.js', function() {
        it("should ...", function() {
            var query = {
                "p": {
                    "data": [{
                        "type": "ignore"
                    }, {
                        "type": "tuple",
                        "data": [
                            2,
                            3,
                            4,
                            5
                        ]
                    }, {
                        "type": "constant",
                        "data": "john"
                    }, {
                        "type": "constant",
                        "data": "likes"
                    }, {
                        "type": "variable",
                        "data": "stuff"
                    }, {
                        "type": "variable",
                        "data": "p"
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
                            3,
                            4,
                            5
                        ],
                        "virtual": {
                            "states": [],
                            "recursive": [],
                            "score": 0,
                            "vscore": 0
                        }
                    }, {
                        "type": "constant",
                        "data": "john"
                    }, {
                        "type": "constant",
                        "data": "likes"
                    }, {
                        "type": "constant",
                        "data": "wine"
                    }, {
                        "type": "variable"
                    }],
                    "start": 1
                },
                "writePointer": 12,
                "write": {
                    "1": {
                        "type": "tuple",
                        "data": [
                            2,
                            3,
                            4,
                            5
                        ],
                        "check": true
                    },
                    "2": {
                        "type": "constant",
                        "data": "john"
                    },
                    "3": {
                        "type": "constant",
                        "data": "likes"
                    },
                    "4": {
                        "type": "variable",
                        "data": "stuff"
                    },
                    "5": {
                        "type": "variable",
                        "data": "p"
                    },
                    "7": {
                        "type": "tuple",
                        "data": [
                            8,
                            9,
                            10,
                            11
                        ],
                        "virtual": {
                            "score": 0,
                            "vscore": 0,
                            "states": [],
                            "recursive": []
                        }
                    },
                    "8": {
                        "type": "constant",
                        "data": "john"
                    },
                    "9": {
                        "type": "constant",
                        "data": "likes"
                    },
                    "10": {
                        "type": "constant",
                        "data": "wine"
                    },
                    "11": {
                        "type": "variable"
                    }
                }
            };

            var p = Writer.load(query);

            unify(p, 1, 7);

            should(p.snapshot()).eql({
                p: {
                    data: [{
                        type: 'ignore'
                    }, {
                        data: [2, 3, 4, 5],
                        type: 'tuple'
                    }, {
                        data: 'john',
                        type: 'constant'
                    }, {
                        data: 'likes',
                        type: 'constant'
                    }, {
                        data: 'stuff',
                        type: 'variable'
                    }, {
                        data: 'p',
                        type: 'variable'
                    }],
                    start: 1
                },
                q: {
                    data: [{
                        type: 'ignore'
                    }, {
                        data: [2, 3, 4, 5],
                        type: 'tuple',
                        virtual: {
                            recursive: [],
                            score: 0,
                            states: [],
                            vscore: 0
                        }
                    }, {
                        data: 'john',
                        type: 'constant'
                    }, {
                        data: 'likes',
                        type: 'constant'
                    }, {
                        data: 'wine',
                        type: 'constant'
                    }, {
                        type: 'variable'
                    }],
                    start: 1
                },
                write: {
                    '1': {
                        data: 7,
                        type: 'defer'
                    },
                    '10': {
                        data: 'wine',
                        type: 'constant'
                    },
                    '11': {
                        type: 'variable'
                    },
                    '2': {
                        data: 'john',
                        type: 'constant'
                    },
                    '3': {
                        data: 'likes',
                        type: 'constant'
                    },
                    '4': {
                        data: 10,
                        type: 'defer'
                    },
                    '5': {
                        data: 11,
                        type: 'defer'
                    },
                    '7': {
                        check: true,
                        data: [8, 9, 10, 11],
                        type: 'tuple',
                        virtual: {
                            recursive: [],
                            score: 0,
                            states: [],
                            vscore: 0
                        }
                    },
                    '8': {
                        data: 'john',
                        type: 'constant'
                    },
                    '9': {
                        data: 'likes',
                        type: 'constant'
                    }
                },
                writePointer: 13
            });
        });

    });

    describe('writer.js', function() {
        it("should keep notify on variable", function() {
            var p = Writer.load({
                "p": {
                    "data": [
                        {
                            "type": "ignore"
                        }, {
                            "type": "tuple",
                            "check": true,
                            "data": [
                                5,
                                2
                            ]
                        }, {
                            "type": "constant",
                            "data": "john",
                            "unify": 3
                        }, {
                            "type": "unify",
                            "data": [
                                2,
                                4
                            ]
                        }, {
                            "type": "not",
                            "data": 5,
                            "unify": 3,
                            "notify": [
                                3
                            ]
                        }, {
                            "type": "variable",
                            "data": "x",
                            "notify": [
                                3
                            ]
                        }
                    ],
                    "start": 1
                },
                "writePointer": 6,
                "write": {}
            });

            // try to union with itself.
            should(p.union(p).snapshot()).eql({
              p: {
                data: [
                  { type: 'ignore' },
                  { check: true, data: [ 5, 2 ], type: 'tuple' },
                  { data: 'john', type: 'constant', unify: 3 },
                  { data: [ 2, 4 ], type: 'unify' },
                  { data: 5, notify: [ 3 ], type: 'not', unify: 3 },
                  { data: 'x', notify: [ 3 ], type: 'variable' }
                ],
                start: 1
              },
              write: {},
              writePointer: 12
            });
        });
    });

    describe('z.js', function() {

    });
});
