var should = require("should");
var operators = require("../lib/operators");

describe('Test Core Functions.', function() {
	it("should merge two tables", function () {
	
		var dbg = operators.dbg({
                	prefix: "operators.",
                	out: "logs/operators",
                	replace: true,
                	init: "var operators = require('../lib/operators.js');\n\n",
                	enable: true,
                	split: true,
                	json: false,
                	// filter: /\(nat 'x\$7\)/g
		});
	
		// dbg(function () {
		should(operators.setValue({
			"vars": {
				"a": {
					"type": "value",
					"variable": {
						"type": "variable",
						"name": "a"
					},
					"notEquals": [],
					"value": {
						"type": "constant",
						"value": "0"
					}
				},
				"x$4": {
					"type": "defered",
					"variable": {
						"type": "variable",
						"name": "x$4"
					},
					"defered": {
						"type": "variable",
						"name": "a"
					}
				},
				"x$2": {
					"type": "value",
					"variable": {
						"type": "variable",
						"name": "x$2"
					},
					"notEquals": []
				},
				"x$5": {
					"type": "defered",
					"variable": {
						"type": "variable",
						"name": "x$5"
					},
					"defered": {
						"type": "variable",
						"name": "x$2"
					}
				},
				"x$1": {
					"type": "value",
					"variable": {
						"type": "variable",
						"name": "x$1"
					},
					"value": {
						"type": "tuple",
						"tuple": [
							{
								"type": "constant",
								"value": "nat"
							},
							{
								"type": "variable",
								"name": "x$3"
							}
						]
					}
				}
			},
			"bound": [
				"x$4",
				"x$5",
				"x$3"
			]
		},
		{
			"type": "variable",
			"name": "x$1"
		},
		{
			"type": "value",
			"variable": {
				"type": "variable",
				"name": "x$1"
			},
			"value": {
				"type": "tuple",
				"tuple": [
					{
						"type": "constant",
						"value": "nat"
					},
					{
						"type": "variable",
						"name": "x$4"
					}
				]
			}
		})).eql({
			  bound: [ 'x$4', 'x$5', 'x$3' ],
			  vars: {
			    a: {
			      defered: { name: 'x$4', type: 'variable' },
			      type: 'defered',
			      variable: { name: 'a', type: 'variable' }
			    },
			    x$1: {
			      notEquals: undefined,
			      type: 'value',
			      value: {
			        tuple: [
			          { type: 'constant', value: 'nat' },
			          { name: 'x$3', type: 'variable' }
			        ],
			        type: 'tuple'
			      },
			      variable: { name: 'x$1', type: 'variable' }
			    },
			    x$2: {
			      defered: { name: 'x$5', type: 'variable' },
			      type: 'defered',
			      variable: { name: 'x$2', type: 'variable' }
			    },
			    x$3: {
			      defered: { name: 'x$4', type: 'variable' },
			      type: 'defered',
			      variable: { name: 'x$3', type: 'variable' }
			    },
			    x$4: {
			      notEquals: [],
			      type: 'value',
			      value: { type: 'constant', value: '0' },
			      variable: { name: 'x$4', type: 'variable' }
			    },
			    x$5: {
			      notEquals: [],
			      type: 'value',
			      value: undefined,
			      variable: { name: 'x$5', type: 'variable' }
			    }
			  }
		});

		// });

		should(operators.merge({
			"vars": {
				"a": {
					"type": "value",
					"variable": {
						"type": "variable",
						"name": "a"
					},
					"notEquals": [],
					"value": {
						"type": "constant",
						"value": "0"
					}
				},
				"x$4": {
					"type": "defered",
					"variable": {
						"type": "variable",
						"name": "x$4"
					},
					"defered": {
						"type": "variable",
						"name": "a"
					}
				},
				"x$2": {
					"type": "value",
					"variable": {
						"type": "variable",
						"name": "x$2"
					},
					"notEquals": []
				},
				"x$5": {
					"type": "defered",
					"variable": {
						"type": "variable",
						"name": "x$5"
					},
					"defered": {
						"type": "variable",
						"name": "x$2"
					}
				},
				"b": {
					"type": "value",
					"variable": {
						"type": "variable",
						"name": "b"
					},
					"value": {
						"type": "constant",
						"value": "0"
					}
				},
				"r": {
					"type": "value",
					"variable": {
						"type": "variable",
						"name": "r"
					},
					"value": {
						"type": "tuple",
						"tuple": [
							{
								"type": "constant",
								"value": "nat"
							},
							{
								"type": "variable",
								"name": "x$1"
							}
						]
					}
				},
				"x$0": {
					"type": "value",
					"variable": {
						"type": "variable",
						"name": "x$0"
					},
					"value": {
						"type": "tuple",
						"tuple": [
							{
								"type": "constant",
								"value": "+"
							},
							{
								"type": "tuple",
								"tuple": [
									{
										"type": "constant",
										"value": "nat"
									},
									{
										"type": "variable",
										"name": "a"
									}
								]
							},
							{
								"type": "tuple",
								"tuple": [
									{
										"type": "constant",
										"value": "nat"
									},
									{
										"type": "variable",
										"name": "b"
									}
								]
							},
							{
								"type": "variable",
								"name": "x$1"
							},
							{
								"type": "variable",
								"name": "x$2"
							}
						]
					}
				},
				"n": {
					"type": "value",
					"variable": {
						"type": "variable",
						"name": "n"
					},
					"value": {
						"type": "constant",
						"value": "0"
					}
				},
				"x$1": {
					"type": "value",
					"variable": {
						"type": "variable",
						"name": "x$1"
					},
					"value": {
						"type": "tuple",
						"tuple": [
							{
								"type": "constant",
								"value": "nat"
							},
							{
								"type": "variable",
								"name": "x$3"
							}
						]
					}
				}
			},
			"bound": [
				"x$4",
				"x$5",
				"x$3"
			]
		},
		{
			"vars": {
				"x$4": {
					"type": "value",
					"variable": {
						"type": "variable",
						"name": "x$4"
					},
					"notEquals": []
				},
				"x$3": {
					"type": "defered",
					"variable": {
						"type": "variable",
						"name": "x$3"
					},
					"defered": {
						"type": "variable",
						"name": "x$4"
					}
				}
			},
			"bound": []
		})).eql({
			bound: [ 'x$6', 'x$5', 'x$7' ],
			vars: {
			    a: {
			      defered: { name: 'x$6', type: 'variable' },
			      type: 'defered',
			      variable: { name: 'a', type: 'variable' }
			    },
			    b: {
			      notEquals: undefined,
			      type: 'value',
			      value: { type: 'constant', value: '0' },
			      variable: { name: 'b', type: 'variable' }
			    },
			    n: {
			      notEquals: undefined,
			      type: 'value',
			      value: { type: 'constant', value: '0' },
			      variable: { name: 'n', type: 'variable' }
			    },
			    r: {
			      notEquals: undefined,
			      type: 'value',
			      value: {
			        tuple: [
			          { type: 'constant', value: 'nat' },
			          { name: 'x$1', type: 'variable' }
			        ],
			        type: 'tuple'
			      },
			      variable: { name: 'r', type: 'variable' }
			    },
			    x$0: {
			      notEquals: undefined,
			      type: 'value',
			      value: {
			        tuple: [
			          { type: 'constant', value: '+' },
			          {
			            tuple: [
			              { type: 'constant', value: 'nat' },
			              { name: 'a', type: 'variable' }
			            ],
			            type: 'tuple'
			          },
			          {
			            tuple: [
			              { type: 'constant', value: 'nat' },
			              { name: 'b', type: 'variable' }
			            ],
			            type: 'tuple'
			          },
			          { name: 'x$1', type: 'variable' },
			          { name: 'x$2', type: 'variable' }
			        ],
			        type: 'tuple'
			      },
			      variable: { name: 'x$0', type: 'variable' }
			    },
			    x$1: {
			      notEquals: undefined,
			      type: 'value',
			      value: {
			        tuple: [
			          { type: 'constant', value: 'nat' },
			          { name: 'x$7', type: 'variable' }
			        ],
			        type: 'tuple'
			      },
			      variable: { name: 'x$1', type: 'variable' }
			    },
			    x$2: {
			      defered: { name: 'x$5', type: 'variable' },
			      type: 'defered',
			      variable: { name: 'x$2', type: 'variable' }
			    },
			    x$3: {
			      notEquals: [],
			      type: 'value',
			      value: undefined,
			      variable: { name: 'x$3', type: 'variable' }
			    },
			    x$4: {
			      defered: { name: 'x$3', type: 'variable' },
			      type: 'defered',
			      variable: { name: 'x$4', type: 'variable' }
			    },
			    x$5: {
			      notEquals: [],
			      type: 'value',
			      value: undefined,
			      variable: { name: 'x$5', type: 'variable' }
			    },
			    x$6: {
			      notEquals: [],
			      type: 'value',
			      value: { type: 'constant', value: '0' },
			      variable: { name: 'x$6', type: 'variable' }
			    }
			  }
			});
	});

	it("should merge table tables", function () {
			should(operators.mergeTableTables(
				{
				"vars": {
					"x$1": {
						"type": "value",
						"variable": {
							"type": "variable",
							"name": "x$1"
						},
						"notEquals": [],
						"value": {
							"type": "constant",
							"value": "food"
						}
					},
					"stuff": {
						"type": "defered",
						"variable": {
							"type": "variable",
							"name": "stuff"
						},
						"defered": {
							"type": "variable",
							"name": "x$1"
						}
					},
					"x$2": {
						"type": "value",
						"variable": {
							"type": "variable",
							"name": "x$2"
						},
						"notEquals": []
					},
					"x$0": {
						"type": "defered",
						"variable": {
							"type": "variable",
							"name": "x$0"
						},
						"defered": {
							"type": "variable",
							"name": "x$2"
						}
					},
					"p": {
						"type": "value",
						"variable": {
							"type": "variable",
							"name": "p"
						},
						"value": {
							"type": "tuple",
							"tuple": [
								{
									"type": "constant",
									"value": "mary"
								},
								{
									"type": "constant",
									"value": "likes"
								},
								{
									"type": "variable",
									"name": "x$1"
								},
								{
									"type": "variable",
									"name": "x$0"
								}
							]
						}
					}
				},
				"bound": [
					"x$2"
				]
			},
			[
				{
					"vars": {
						"x$0": {
							"type": "value",
							"variable": {
								"type": "variable",
								"name": "x$0"
							},
							"notEquals": []
						},
						"x$2": {
							"type": "defered",
							"variable": {
								"type": "variable",
								"name": "x$2"
							},
							"defered": {
								"type": "variable",
								"name": "x$0"
							}
						},
						"x$1": {
							"type": "value",
							"variable": {
								"type": "variable",
								"name": "x$1"
							},
							"value": {
								"type": "constant",
								"value": "food"
							}
						}
					},
					"bound": [
						"x$2"
					]
				},
				{
					"vars": {
						"x$0": {
							"type": "value",
							"variable": {
								"type": "variable",
								"name": "x$0"
							},
							"notEquals": []
						},
						"x$2": {
							"type": "defered",
							"variable": {
								"type": "variable",
								"name": "x$2"
							},
							"defered": {
								"type": "variable",
								"name": "x$0"
							}
						},
						"x$1": {
							"type": "value",
							"variable": {
								"type": "variable",
								"name": "x$1"
							},
							"value": {
								"type": "constant",
								"value": "wine"
							}
						}
					},
					"bound": [
						"x$2"
					]
				}
			])).eql([
				  {
				    bound: [ 'x$3', 'x$2' ],
				    vars: {
				      p: {
				        notEquals: undefined,
				        type: 'value',
				        value: {
				          tuple: [
				            { type: 'constant', value: 'mary' },
				            { type: 'constant', value: 'likes' },
				            { name: 'x$1', type: 'variable' },
				            { name: 'x$0', type: 'variable' }
				          ],
				          type: 'tuple'
				        },
				        variable: { name: 'p', type: 'variable' }
				      },
				      stuff: {
				        defered: { name: 'x$1', type: 'variable' },
				        type: 'defered',
				        variable: { name: 'stuff', type: 'variable' }
				      },
				      x$0: {
				        defered: { name: 'x$2', type: 'variable' },
				        type: 'defered',
				        variable: { name: 'x$0', type: 'variable' }
				      },
				      x$1: {
				        notEquals: [],
				        type: 'value',
				        value: { type: 'constant', value: 'food' },
				        variable: { name: 'x$1', type: 'variable' }
				      },
				      x$2: {
				        notEquals: [],
				        type: 'value',
				        value: undefined,
				        variable: { name: 'x$2', type: 'variable' }
				      },
				      x$3: {
				        defered: { name: 'x$2', type: 'variable' },
				        type: 'defered',
				        variable: { name: 'x$3', type: 'variable' }
				      }
				    }
				  }
				]);	
	});
	
	it("should rename table vars", function () {
		should(operators.renameTablesVars({
			"vars": {
				"x$1": {
					"type": "value",
					"variable": {
						"type": "variable",
						"name": "x$1"
					},
					"notEquals": []
				},
				"x$0": {
					"type": "defered",
					"variable": {
						"type": "variable",
						"name": "x$0"
					},
					"defered": {
						"type": "variable",
						"name": "x$1"
					}
				}
			},
			"bound": [
				"x$1"
			]
		},
		{
			"x$1": "x$5",
		})).eql({
			"vars": {
				"x$0": {
					"type": "defered",
					"variable": {
						"type": "variable",
						"name": "x$0"
					},
					"defered": {
						"type": "variable",
						"name": "x$5"
					}
				},
				"x$5": {
					"type": "value",
					"variable": {
						"type": "variable",
						"name": "x$5"
					},
					"notEquals": []
				}
			},
			"bound": [
				"x$5"
			]
		});
	});

	it('Should unify two variables', function () {
		should(operators.unify_variable_variable({
			"type": "variable",
			"name": "a"
		},
		{
			"type": "variable",
			"name": "x$1"
		})).eql({
			"vars": {
				"x$1": {
					"type": "defered",
					"variable": {
						"type": "variable",
						"name": "x$1"
					},
					"defered": {
						"type": "variable",
						"name": "a"
					}
				},
				"a": {
					"type": "value",
					"variable": {
						"type": "variable",
						"name": "a"
					},
					"notEquals": []
				}
			},
			"bound": []
		});
	});
	
	it('Should merge not values functions.', function () {
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

