var should = require("should");
var operators = require("../lib/operators");

describe('Test Core Functions.', function() {
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
	
	it('Should return a result on queryStep', function () {
	   	should(operators.queryStep(
	   		undefined, 
	   		{ // query => ((yellow) (p))
	   			"type": "tuple",
	   			"tuple": [{
	   				"type": "tuple",
	   				"tuple": [{
	   					"type": "constant",
	   					"value": "yellow"
	   				}]
	   			}, {
	   				"type": "tuple",
	   				"tuple": [{
	   					"type": "variable",
	   					"name": "p"
	   				}]
	   			}],
	   			"bound": [
	   				"p"
	   			]
	   		}, [{ // defs
	   			// (q)
	   			"type": "tuple",
	   			"tuple": [{
	   				"type": "variable",
	   				"name": "q"
	   			}],
	   			"bound": [
	   				"q"
	   			]
	   		}, { // ((q) (q))
	   			"type": "tuple",
	   			"tuple": [{
	   				"type": "tuple",
	   				"tuple": [{
	   					"type": "variable",
	   					"name": "q"
	   				}]
	   			}, {
	   				"type": "tuple",
	   				"tuple": [{
	   					"type": "variable",
	   					"name": "q"
	   				}]
	   			}],
	   			"bound": [
	   				"q"
	   			]
	   		}],
	   		undefined,
	   		0)
	   	).eql([
		  	{
			    bound: [ 'x$1', 'x$0', 'p', 'q' ],
			    vars: {
					p: {
				        defered: { name: 'q', type: 'variable' },
				        type: 'defered',
				        variable: { name: 'p', type: 'variable' }
			      	},
			      	q: {
			        	notEquals: [],
			        	type: 'value',
			        	value: { type: 'constant', value: 'yellow' },
			        	variable: { name: 'q', type: 'variable' }
			      	},
			      	x$0: {
			        	notEquals: undefined,
			        	type: 'value',
			        	value: { type: 'constant', value: 'yellow' },
			        	variable: { name: 'x$0', type: 'variable' }
			      	},
			      	x$1: {
			        	defered: { name: 'q', type: 'variable' },
			        	type: 'defered',
			        	variable: { name: 'x$1', type: 'variable' }
			      	}
			    }
		  	}
		]);
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

