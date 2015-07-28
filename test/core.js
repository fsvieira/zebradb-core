var should = require("should");
var operators = require("../lib/operators");

describe('Test Core Functions.', function() {
    it('Test Core functions.', function () {
       should(operators.merge({
        	"vars": {
        		"item": {
        			"type": "value",
        			"variable": {
        				"type": "variable",
        				"name": "item"
        			},
        			"value": {
        				"type": "tuple",
        				"tuple": [
        					{
        						"type": "constant",
        						"value": "color"
        					},
        					{
        						"type": "variable",
        						"name": "a"
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
        						"name": "item"
        					}
        				],
        				"name": "x$0"
        			},
        			"value": {
        				"type": "tuple",
        				"tuple": [
        					{
        						"type": "constant",
        						"value": "color"
        					},
        					{
        						"type": "variable",
        						"name": "b"
        					}
        				]
        			},
        			"notEquals": [
        				{
        					"type": "variable",
        					"name": "item"
        				}
        			]
        		}
        	},
        	"bound": [
        		"a",
        		"b",
        		"item",
        		"x$0"
        	],
        	"childs": [
        		{
        			"vars": {
        				"item": {
        					"type": "value",
        					"variable": {
        						"type": "variable",
        						"name": "item"
        					},
        					"value": {
        						"type": "tuple",
        						"tuple": [
        							{
        								"type": "constant",
        								"value": "color"
        							},
        							{
        								"type": "variable",
        								"name": "a"
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
        								"name": "item"
        							}
        						],
        						"name": "x$0"
        					},
        					"value": {
        						"type": "tuple",
        						"tuple": [
        							{
        								"type": "constant",
        								"value": "color"
        							},
        							{
        								"type": "variable",
        								"name": "b"
        							}
        						]
        					},
        					"notEquals": [
        						{
        							"type": "variable",
        							"name": "item"
        						}
        					]
        				},
        				"a": {
        					"type": "value",
        					"variable": {
        						"type": "variable",
        						"name": "a"
        					},
        					"value": {
        						"type": "constant",
        						"value": "yellow"
        					}
        				}
        			},
        			"bound": [
        				"a",
        				"b",
        				"item",
        				"x$0"
        			]
        		},
        		{
        			"vars": {
        				"item": {
        					"type": "value",
        					"variable": {
        						"type": "variable",
        						"name": "item"
        					},
        					"value": {
        						"type": "tuple",
        						"tuple": [
        							{
        								"type": "constant",
        								"value": "color"
        							},
        							{
        								"type": "variable",
        								"name": "a"
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
        								"name": "item"
        							}
        						],
        						"name": "x$0"
        					},
        					"value": {
        						"type": "tuple",
        						"tuple": [
        							{
        								"type": "constant",
        								"value": "color"
        							},
        							{
        								"type": "variable",
        								"name": "b"
        							}
        						]
        					},
        					"notEquals": [
        						{
        							"type": "variable",
        							"name": "item"
        						}
        					]
        				},
        				"a": {
        					"type": "value",
        					"variable": {
        						"type": "variable",
        						"name": "a"
        					},
        					"value": {
        						"type": "constant",
        						"value": "blue"
        					}
        				}
        			},
        			"bound": [
        				"a",
        				"b",
        				"item",
        				"x$0"
        			]
        		},
        		{
        			"vars": {
        				"item": {
        					"type": "value",
        					"variable": {
        						"type": "variable",
        						"name": "item"
        					},
        					"value": {
        						"type": "tuple",
        						"tuple": [
        							{
        								"type": "constant",
        								"value": "color"
        							},
        							{
        								"type": "variable",
        								"name": "a"
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
        								"name": "item"
        							}
        						],
        						"name": "x$0"
        					},
        					"value": {
        						"type": "tuple",
        						"tuple": [
        							{
        								"type": "constant",
        								"value": "color"
        							},
        							{
        								"type": "variable",
        								"name": "b"
        							}
        						]
        					},
        					"notEquals": [
        						{
        							"type": "variable",
        							"name": "item"
        						}
        					]
        				},
        				"a": {
        					"type": "value",
        					"variable": {
        						"type": "variable",
        						"name": "a"
        					},
        					"value": {
        						"type": "constant",
        						"value": "red"
        					}
        				}
        			},
        			"bound": [
        				"a",
        				"b",
        				"item",
        				"x$0"
        			]
        		}
        	]
        },
        {
        	"vars": {
        		"b": {
        			"type": "value",
        			"variable": {
        				"type": "variable",
        				"name": "b"
        			},
        			"value": {
        				"type": "constant",
        				"value": "yellow"
        			}
        		}
        	},
        	"bound": []
        })).eql({
          bound: [ 'a', 'b', 'item', 'x$0' ],
          childs: [
            {
              bound: [ 'a', 'b', 'item', 'x$0' ],
              vars: {
                a: {
                  notEquals: undefined,
                  type: 'value',
                  value: { type: 'constant', value: 'blue' },
                  variable: { name: 'a', type: 'variable' }
                },
                b: {
                  notEquals: undefined,
                  type: 'value',
                  value: { type: 'constant', value: 'yellow' },
                  variable: { name: 'b', type: 'variable' }
                },
                item: {
                  notEquals: undefined,
                  type: 'value',
                  value: {
                    tuple: [
                      { type: 'constant', value: 'color' },
                      { name: 'a', type: 'variable' }
                    ],
                    type: 'tuple'
                  },
                  variable: { name: 'item', type: 'variable' }
                },
                x$0: {
                  notEquals: [],
                  type: 'value',
                  value: {
                    tuple: [
                      { type: 'constant', value: 'color' },
                      { name: 'b', type: 'variable' }
                    ],
                    type: 'tuple'
                  },
                  variable: {
                    name: 'x$0',
                    notEquals: [ { name: 'item', type: 'variable' } ],
                    type: 'variable'
                  }
                }
              }
            },
            {
              bound: [ 'a', 'b', 'item', 'x$0' ],
              vars: {
                a: {
                  notEquals: undefined,
                  type: 'value',
                  value: { type: 'constant', value: 'red' },
                  variable: { name: 'a', type: 'variable' }
                },
                b: {
                  notEquals: undefined,
                  type: 'value',
                  value: { type: 'constant', value: 'yellow' },
                  variable: { name: 'b', type: 'variable' }
                },
                item: {
                  notEquals: undefined,
                  type: 'value',
                  value: {
                    tuple: [
                      { type: 'constant', value: 'color' },
                      { name: 'a', type: 'variable' }
                    ],
                    type: 'tuple'
                  },
                  variable: { name: 'item', type: 'variable' }
                },
                x$0: {
                  notEquals: [],
                  type: 'value',
                  value: {
                    tuple: [
                      { type: 'constant', value: 'color' },
                      { name: 'b', type: 'variable' }
                    ],
                    type: 'tuple'
                  },
                  variable: {
                    name: 'x$0',
                    notEquals: [ { name: 'item', type: 'variable' } ],
                    type: 'variable'
                  }
                }
              }
            }
          ],
          vars: {
            b: {
              notEquals: undefined,
              type: 'value',
              value: { type: 'constant', value: 'yellow' },
              variable: { name: 'b', type: 'variable' }
            },
            item: {
              notEquals: undefined,
              type: 'value',
              value: {
                tuple: [
                  { type: 'constant', value: 'color' },
                  { name: 'a', type: 'variable' }
                ],
                type: 'tuple'
              },
              variable: { name: 'item', type: 'variable' }
            },
            x$0: {
              notEquals: [ { name: 'item', type: 'variable' } ],
              type: 'value',
              value: {
                tuple: [
                  { type: 'constant', value: 'color' },
                  { name: 'b', type: 'variable' }
                ],
                type: 'tuple'
              },
              variable: {
                name: 'x$0',
                notEquals: [ { name: 'item', type: 'variable' } ],
                type: 'variable'
              }
            }
          }
        });
    });
});

