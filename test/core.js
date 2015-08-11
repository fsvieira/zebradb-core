var should = require("should");
var operators = require("../lib/operators");

describe('Test Core Functions.', function() {
    it('Test merge not values functions.', function () {
        should(operators.merge({
        	"vars": {
        		"a": {
        			"type": "value",
        			"variable": {
        				"type": "variable",
        				"name": "a"
        			},
        			"value": {
        				"type": "tuple",
        				"tuple": [
        					{
        						"type": "constant",
        						"value": "number"
        					},
        					{
        						"type": "variable",
        						"name": "p"
        					}
        				]
        			}
        		},
        		"x$0": {
        			"type": "value",
        			"variable": {
        				"type": "variable",
        				"notEquals": [
        					{
        						"type": "variable",
        						"name": "a"
        					}
        				],
        				"name": "x$0"
        			},
        			"value": {
        				"type": "tuple",
        				"tuple": [
        					{
        						"type": "constant",
        						"value": "number"
        					},
        					{
        						"type": "variable",
        						"name": "q"
        					}
        				]
        			},
        			"notEquals": [
        				{
        					"type": "variable",
        					"name": "a"
        				}
        			]
        		},
        		"p": {
        			"type": "value",
        			"variable": {
        				"type": "variable",
        				"name": "p"
        			},
        			"value": {
        				"type": "constant",
        				"value": "1"
        			}
        		}
        	},
        	"bound": []
        },
        {
        	"vars": {
        		"a": {
        			"type": "value",
        			"variable": {
        				"type": "variable",
        				"name": "a"
        			},
        			"value": {
        				"type": "tuple",
        				"tuple": [
        					{
        						"type": "constant",
        						"value": "number"
        					},
        					{
        						"type": "variable",
        						"name": "p"
        					}
        				]
        			}
        		},
        		"x$0": {
        			"type": "value",
        			"variable": {
        				"type": "variable",
        				"notEquals": [
        					{
        						"type": "variable",
        						"name": "a"
        					}
        				],
        				"name": "x$0"
        			},
        			"value": {
        				"type": "tuple",
        				"tuple": [
        					{
        						"type": "constant",
        						"value": "number"
        					},
        					{
        						"type": "variable",
        						"name": "q"
        					}
        				]
        			},
        			"notEquals": [
        				{
        					"type": "variable",
        					"name": "a"
        				}
        			]
        		},
        		"q": {
        			"type": "value",
        			"variable": {
        				"type": "variable",
        				"name": "q"
        			},
        			"value": {
        				"type": "constant",
        				"value": "1"
        			}
        		}
        	},
        	"bound": []
        })).eql(undefined);
        
        
        should(operators.merge({
        	"vars": {
        		"a": {
        			"type": "value",
        			"variable": {
        				"type": "variable",
        				"name": "a"
        			},
        			"value": {
        				"type": "tuple",
        				"tuple": [
        					{
        						"type": "constant",
        						"value": "number"
        					},
        					{
        						"type": "variable",
        						"name": "p"
        					}
        				]
        			}
        		},
        		"x$0": {
        			"type": "value",
        			"variable": {
        				"type": "variable",
        				"notEquals": [
        					{
        						"type": "variable",
        						"name": "a"
        					}
        				],
        				"name": "x$0"
        			},
        			"value": {
        				"type": "tuple",
        				"tuple": [
        					{
        						"type": "constant",
        						"value": "number"
        					},
        					{
        						"type": "variable",
        						"name": "q"
        					}
        				]
        			},
        			"notEquals": [
        				{
        					"type": "variable",
        					"name": "a"
        				}
        			]
        		},
        		"p": {
        			"type": "value",
        			"variable": {
        				"type": "variable",
        				"name": "p"
        			},
        			"value": {
        				"type": "constant",
        				"value": "1"
        			}
        		}
        	},
        	"bound": []
        },
        {
        	"vars": {
        		"a": {
        			"type": "value",
        			"variable": {
        				"type": "variable",
        				"name": "a"
        			},
        			"value": {
        				"type": "tuple",
        				"tuple": [
        					{
        						"type": "constant",
        						"value": "number"
        					},
        					{
        						"type": "variable",
        						"name": "p"
        					}
        				]
        			}
        		},
        		"x$0": {
        			"type": "value",
        			"variable": {
        				"type": "variable",
        				"notEquals": [
        					{
        						"type": "variable",
        						"name": "a"
        					}
        				],
        				"name": "x$0"
        			},
        			"value": {
        				"type": "tuple",
        				"tuple": [
        					{
        						"type": "constant",
        						"value": "number"
        					},
        					{
        						"type": "variable",
        						"name": "q"
        					}
        				]
        			},
        			"notEquals": [
        				{
        					"type": "variable",
        					"name": "a"
        				}
        			]
        		},
        		"q": {
        			"type": "value",
        			"variable": {
        				"type": "variable",
        				"name": "q"
        			},
        			"value": {
        				"type": "constant",
        				"value": "0"
        			}
        		}
        	},
        	"bound": []
        })).eql({
                bound: [],
                vars: {
                    a: {
                        notEquals: undefined,
                        type: 'value',
                        value: {
                            tuple: [
                              { type: 'constant', value: 'number' },
                              { name: 'p', type: 'variable' }
                            ],
                            type: 'tuple'
                        },
                        variable: { name: 'a', type: 'variable' }
                    },
                    p: {
                        notEquals: [],
                        type: 'value',
                        value: { type: 'constant', value: '1' },
                        variable: { name: 'p', type: 'variable' }
                    },
                    q: {
                        notEquals: [],
                        type: 'value',
                        value: { type: 'constant', value: '0' },
                        variable: { name: 'q', type: 'variable' }
                    },
                    x$0: {
                        notEquals: [ { name: 'a', type: 'variable' } ],
                        type: 'value',
                        value: {
                            tuple: [
                              { type: 'constant', value: 'number' },
                              { name: 'q', type: 'variable' }
                            ],
                            type: 'tuple'
                          },
                        variable: {
                            name: 'x$0',
                            notEquals: [ { name: 'a', type: 'variable' } ],
                            type: 'variable'
                        }
                    }
                }
            });
    });
});

