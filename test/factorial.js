var should = require("should");
var Z = require("../lib/z");
var utils = require("../lib/utils");

describe('Factorial Parser Tests.', function() {
    describe('Natural Numbers', function() {
        it('Should declare ~Peanno numbers', function () {

            var query = new Z.run(
                "(nat 0)\n" +
                "(nat (nat 'n))"
            );

            should(utils.tableFieldsToString(
                query("(nat (nat 1))")
            )).eql({"query": "?(nat (nat 1))"});

            should(utils.tableFieldsToString(
                query("(nat (nat 0))")
            )).eql({
                query: '?(nat (nat 0))',
                result: [ { bound: [ 'n' ], vars: { n: '0' } } ]
            });

            should(utils.tableFieldsToString(
                query(
                    "(nat 'n)",
                    5
                )
            )).eql({
                query: '?(nat \'n)',
                result: [
                    { bound: [ 'n' ], vars: { n: '0' } },
                    { bound: [ 'n', 'x$0' ], vars: { n: '(nat \'x$0)', x$0: '0' } },
                    {
                        bound: [ 'n', 'x$0', 'x$1' ],
                        vars: { n: '(nat \'x$0)', x$0: '(nat \'x$1)', x$1: '0' }
                    },
                    {
                        bound: [ 'n', 'x$0', 'x$1', 'x$2' ],
                        vars: { n: '(nat \'x$0)', x$0: '(nat \'x$1)', x$1: '(nat \'x$2)', x$2: '0' }
                    },
                    {
                        bound: [ 'n', 'x$0', 'x$1', 'x$2', 'x$3' ],
                        vars: {
                            n: '(nat \'x$0)',
                            x$0: '(nat \'x$1)',
                            x$1: '(nat \'x$2)',
                            x$2: '(nat \'x$3)',
                            x$3: '0'
                        }
                    }
                ]
            });
        });

        it('Should declare a add func', function () {

            var query = new Z.run(
                "(nat 0)" +
                "(nat (nat 'n))" +

                // a . 0 = a,
                "(+ (nat 'a) (nat 0) (nat 'a) ')" +

                // a . S(b) = a + (a . b)
                "(+ (nat 'a) (nat (nat 'b)) (nat 'r) (+ (nat 'a) (nat 'b) 'r '))"
            );

            // 0 + 0 = 0
            should(utils.tableFieldsToString(query(
                "(+ (nat 0) (nat 0) 'r ')"
            ))).eql({
                query: '?(+ (nat 0) (nat 0) \'r \'x$0)',
                result: [
                    {
                        bound: [ 'a', 'r', 'x$0', 'x$1' ],
                        vars: { a: '0', r: '(nat \'a)', x$0: '\'x$1', x$1: '' }
                    }
                ]
            });
            
            // 1 + 0 = 1
            should(utils.tableFieldsToString(query(
                "(+ (nat (nat 0)) (nat 0) 'r ')"
            ))).eql({
                query: '?(+ (nat (nat 0)) (nat 0) \'r \'x$0)',
                result: [
                    {
                        bound: [ 'a', 'n', 'r', 'x$0', 'x$1', 'x$2' ],
                        vars: { a: '(nat 0)', n: '0', r: '(nat \'a)', x$0: '', x$1: '\'x$0', x$2: '0' }
                    }
                ]
            });

            // 0 + 1 = 1
            should(utils.tableFieldsToString(query(
                "(+ (nat 0) (nat (nat 0)) 'r ')"
            ))).eql({
                query: '?(+ (nat 0) (nat (nat 0)) \'r \'x$0)',
                result: [
                    {
                      bound: [ 'a', 'b', 'n', 'r', 'x$0', 'x$1', 'x$2', 'x$3', 'x$4', 'x$5' ],
                      vars: {
                        a: '\'x$4',
                        b: '0',
                        n: '0',
                        r: '(nat \'x$1)',
                        x$0: '(+ (nat \'a) (nat \'b) \'x$1 \'x$2)',
                        x$1: '(nat \'x$3)',
                        x$2: '\'x$5',
                        x$3: '\'x$4',
                        x$4: '0',
                        x$5: ''
                      }
                    }
                ]
            });

            // 2 + 3 = 5
            should(utils.tableFieldsToString(query(
                "(+ (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) 'r ')"
            ))).eql({
                query: '?(+ (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) \'r \'x$0)',
                result: [
                    {
                      bound: [
                        'a',
                        'b',
                        'n',
                        'r',
                        'x$0',
                        'x$1',
                        'x$10',
                        'x$11',
                        'x$12',
                        'x$13',
                        'x$14',
                        'x$15',
                        'x$16',
                        'x$17',
                        'x$18',
                        'x$19',
                        'x$2',
                        'x$20',
                        'x$21',
                        'x$22',
                        'x$23',
                        'x$24',
                        'x$25',
                        'x$26',
                        'x$27',
                        'x$28',
                        'x$29',
                        'x$3',
                        'x$30',
                        'x$31',
                        'x$32',
                        'x$4',
                        'x$5',
                        'x$6',
                        'x$7',
                        'x$8',
                        'x$9'
                      ],
                      vars: {
                        a: '\'x$10',
                        b: '(nat (nat 0))',
                        n: '(nat 0)',
                        r: '(nat \'x$1)',
                        x$0: '(+ (nat \'a) (nat \'b) \'x$1 \'x$2)',
                        x$1: '(nat \'x$7)',
                        x$10: '(nat (nat 0))',
                        x$11: '(nat 0)',
                        x$12: '(nat 0)',
                        x$13: '0',
                        x$14: '(nat 0)',
                        x$15: '0',
                        x$16: '(nat \'x$25)',
                        x$17: '0',
                        x$18: '0',
                        x$19: '\'x$10',
                        x$2: '(+ (nat \'x$10) (nat \'x$11) \'x$8 \'x$9)',
                        x$20: '0',
                        x$21: '\'x$16',
                        x$22: '\'x$28',
                        x$23: '(nat 0)',
                        x$24: '0',
                        x$25: '\'x$10',
                        x$26: '0',
                        x$27: '\'x$10',
                        x$28: '',
                        x$29: '(nat 0)',
                        x$3: '0',
                        x$30: '(nat 0)',
                        x$31: '0',
                        x$32: '0',
                        x$4: '(nat (nat 0))',
                        x$5: '(nat 0)',
                        x$6: '0',
                        x$7: '(nat \'x$16)',
                        x$8: '\'x$7',
                        x$9: '(+ (nat \'x$19) (nat \'x$20) \'x$21 \'x$22)'
                      }
                    }
                ]
            });

            // 3 + 2 = 5
            should(utils.tableFieldsToString(query(
                "(+ (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) 'r ')"
            ))).eql({
              query: '?(+ (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) \'r \'x$0)',
              result: [
                {
                  bound: [
                    'a',
                    'b',
                    'n',
                    'r',
                    'x$0',
                    'x$1',
                    'x$10',
                    'x$11',
                    'x$12',
                    'x$13',
                    'x$14',
                    'x$15',
                    'x$16',
                    'x$17',
                    'x$18',
                    'x$19',
                    'x$2',
                    'x$20',
                    'x$21',
                    'x$22',
                    'x$23',
                    'x$24',
                    'x$25',
                    'x$26',
                    'x$3',
                    'x$4',
                    'x$5',
                    'x$6',
                    'x$7',
                    'x$8',
                    'x$9',
                  ],
                  vars: {
                    a: '\'x$10',
                    b: '(nat 0)',
                    n: '(nat (nat 0))',
                    r: '(nat \'x$1)',
                    x$0: '(+ (nat \'a) (nat \'b) \'x$1 \'x$2)',
                    x$1: '(nat \'x$7)',
                    x$10: '(nat (nat (nat 0)))',
                    x$11: '0',
                    x$12: '(nat (nat 0))',
                    x$13: '(nat 0)',
                    x$14: '0',
                    x$15: '0',
                    x$16: '\'x$10',
                    x$17: '(nat 0)',
                    x$18: '0',
                    x$19: '\'x$10',
                    x$2: '(+ (nat \'x$10) (nat \'x$11) \'x$8 \'x$9)',
                    x$20: '',
                    x$21: '(nat (nat 0))',
                    x$22: '(nat (nat 0))',
                    x$23: '(nat 0)',
                    x$24: '0',
                    x$25: '(nat 0)',
                    x$26: '0',
                    x$3: '(nat 0)',
                    x$4: '0',
                    x$5: '(nat 0)',
                    x$6: '0',
                    x$7: '(nat \'x$16)',
                    x$8: '\'x$7',
                    x$9: '\'x$20'
                  }
                }
              ]
            });

            // 2 + 2 = 4
            should(utils.tableFieldsToString(query(
                "(+ (nat (nat (nat 0))) (nat (nat (nat 0))) 'r ')"
            ))).eql({
              query: '?(+ (nat (nat (nat 0))) (nat (nat (nat 0))) \'r \'x$0)',
              result: [
                {
                  bound: [
                    'a',
                    'b',
                    'n',
                    'r',
                    'x$0',
                    'x$1',
                    'x$10',
                    'x$11',
                    'x$12',
                    'x$13',
                    'x$14',
                    'x$15',
                    'x$16',
                    'x$17',
                    'x$18',
                    'x$19',
                    'x$2',
                    'x$20',
                    'x$21',
                    'x$3',
                    'x$4',
                    'x$5',
                    'x$6',
                    'x$7',
                    'x$8',
                    'x$9'
                  ],
                  vars: {
                    a: '\'x$9',
                    b: '(nat 0)',
                    n: '(nat 0)',
                    r: '(nat \'x$1)',
                    x$0: '(+ (nat \'a) (nat \'b) \'x$1 \'x$2)',
                    x$1: '(nat \'x$6)',
                    x$10: '0',
                    x$11: '(nat 0)',
                    x$12: '0',
                    x$13: '0',
                    x$14: '\'x$9',
                    x$15: '0',
                    x$16: '\'x$9',
                    x$17: '',
                    x$18: '(nat 0)',
                    x$19: '(nat 0)',
                    x$2: '(+ (nat \'x$9) (nat \'x$10) \'x$7 \'x$8)',
                    x$20: '0',
                    x$21: '0',
                    x$3: '0',
                    x$4: '(nat 0)',
                    x$5: '0',
                    x$6: '(nat \'x$14)',
                    x$7: '\'x$6',
                    x$8: '\'x$17',
                    x$9: '(nat (nat 0))'
                  }
                }
              ]
            });
        });

        it('Should declare a list', function () {
            var query = new Z.run(
                "(list)" +
                "(list 'item (list ' '))" +
                "(list 'item (list))" +

                "(fruit banana)" +
                "(fruit strawberry)" +
                "(fruit apple)" +
                "(fruit papaya)"
            );

            should(utils.tableFieldsToString(query("(list)"))).eql({ query: '?(list)', result: [ { bound: [], vars: {} } ] });

            should(utils.tableFieldsToString(query(
                "(list (fruit banana) (list (fruit apple) (list)))"
            ))).eql({
                query: '?(list (fruit banana) (list (fruit apple) (list)))',
                result: [
                    {
                      bound: [ 'item', 'x$0', 'x$1', 'x$2' ],
                      vars: {
                        item: '(fruit banana)',
                        x$0: '(fruit apple)',
                        x$1: '(list)',
                        x$2: '(fruit apple)'
                      }
                    }
                ]
            });

            should(utils.tableFieldsToString(query(
                "(list (fruit 'p) (list (fruit ^'p) (list)))"
            ))).eql({
            	"query": "?(list (fruit 'p) (list (fruit 'x$0:[^'p]) (list)))",
            	"result": [
            		{
            			"vars": {
            				"item": "(fruit 'p)",
            				"x$2": "(fruit 'x$0:[^'p])",
            				"x$1": "(list)",
            				"p": "banana",
            				"x$3": "(fruit 'x$0:[^'p])",
            				"x$0": "strawberry"
            			},
            			"bound": [
            				"item",
            				"p",
            				"x$0",
            				"x$1",
            				"x$2",
            				"x$3"
            			]
            		},
            		{
            			"vars": {
            				"item": "(fruit 'p)",
            				"x$2": "(fruit 'x$0:[^'p])",
            				"x$1": "(list)",
            				"p": "banana",
            				"x$3": "(fruit 'x$0:[^'p])",
            				"x$0": "apple"
            			},
            			"bound": [
            				"item",
            				"p",
            				"x$0",
            				"x$1",
            				"x$2",
            				"x$3"
            			]
            		},
            		{
            			"vars": {
            				"item": "(fruit 'p)",
            				"x$2": "(fruit 'x$0:[^'p])",
            				"x$1": "(list)",
            				"p": "banana",
            				"x$3": "(fruit 'x$0:[^'p])",
            				"x$0": "papaya"
            			},
            			"bound": [
            				"item",
            				"p",
            				"x$0",
            				"x$1",
            				"x$2",
            				"x$3"
            			]
            		},
            		{
            			"vars": {
            				"item": "(fruit 'p)",
            				"x$2": "(fruit 'x$0:[^'p])",
            				"x$1": "(list)",
            				"p": "strawberry",
            				"x$3": "(fruit 'x$0:[^'p])",
            				"x$0": "banana"
            			},
            			"bound": [
            				"item",
            				"p",
            				"x$0",
            				"x$1",
            				"x$2",
            				"x$3"
            			]
            		},
            		{
            			"vars": {
            				"item": "(fruit 'p)",
            				"x$2": "(fruit 'x$0:[^'p])",
            				"x$1": "(list)",
            				"p": "strawberry",
            				"x$3": "(fruit 'x$0:[^'p])",
            				"x$0": "apple"
            			},
            			"bound": [
            				"item",
            				"p",
            				"x$0",
            				"x$1",
            				"x$2",
            				"x$3"
            			]
            		},
            		{
            			"vars": {
            				"item": "(fruit 'p)",
            				"x$2": "(fruit 'x$0:[^'p])",
            				"x$1": "(list)",
            				"p": "strawberry",
            				"x$3": "(fruit 'x$0:[^'p])",
            				"x$0": "papaya"
            			},
            			"bound": [
            				"item",
            				"p",
            				"x$0",
            				"x$1",
            				"x$2",
            				"x$3"
            			]
            		},
            		{
            			"vars": {
            				"item": "(fruit 'p)",
            				"x$2": "(fruit 'x$0:[^'p])",
            				"x$1": "(list)",
            				"p": "apple",
            				"x$3": "(fruit 'x$0:[^'p])",
            				"x$0": "banana"
            			},
            			"bound": [
            				"item",
            				"p",
            				"x$0",
            				"x$1",
            				"x$2",
            				"x$3"
            			]
            		},
            		{
            			"vars": {
            				"item": "(fruit 'p)",
            				"x$2": "(fruit 'x$0:[^'p])",
            				"x$1": "(list)",
            				"p": "apple",
            				"x$3": "(fruit 'x$0:[^'p])",
            				"x$0": "strawberry"
            			},
            			"bound": [
            				"item",
            				"p",
            				"x$0",
            				"x$1",
            				"x$2",
            				"x$3"
            			]
            		},
            		{
            			"vars": {
            				"item": "(fruit 'p)",
            				"x$2": "(fruit 'x$0:[^'p])",
            				"x$1": "(list)",
            				"p": "apple",
            				"x$3": "(fruit 'x$0:[^'p])",
            				"x$0": "papaya"
            			},
            			"bound": [
            				"item",
            				"p",
            				"x$0",
            				"x$1",
            				"x$2",
            				"x$3"
            			]
            		},
            		{
            			"vars": {
            				"item": "(fruit 'p)",
            				"x$2": "(fruit 'x$0:[^'p])",
            				"x$1": "(list)",
            				"p": "papaya",
            				"x$3": "(fruit 'x$0:[^'p])",
            				"x$0": "banana"
            			},
            			"bound": [
            				"item",
            				"p",
            				"x$0",
            				"x$1",
            				"x$2",
            				"x$3"
            			]
            		},
            		{
            			"vars": {
            				"item": "(fruit 'p)",
            				"x$2": "(fruit 'x$0:[^'p])",
            				"x$1": "(list)",
            				"p": "papaya",
            				"x$3": "(fruit 'x$0:[^'p])",
            				"x$0": "strawberry"
            			},
            			"bound": [
            				"item",
            				"p",
            				"x$0",
            				"x$1",
            				"x$2",
            				"x$3"
            			]
            		},
            		{
            			"vars": {
            				"item": "(fruit 'p)",
            				"x$2": "(fruit 'x$0:[^'p])",
            				"x$1": "(list)",
            				"p": "papaya",
            				"x$3": "(fruit 'x$0:[^'p])",
            				"x$0": "apple"
            			},
            			"bound": [
            				"item",
            				"p",
            				"x$0",
            				"x$1",
            				"x$2",
            				"x$3"
            			]
            		}
            	]
            });
        });

        it('Should declare a mul func', function () {
            
            var query = new Z.run(
                // Nat
                "(nat 0)" +
                "(nat (nat 'n))" +

                // Add
                // a . 0 = a,
                "(+ (nat 'a) (nat 0) (nat 'a) ')" +

                // a . S(b) = a + (a . b)
                "(+ (nat 'a) (nat (nat 'b)) (nat 'r) (+ (nat 'a) (nat 'b) 'r '))" +

                // List
                "(list)" +
                "(list 'item (list ' '))" +
                "(list 'item (list))" +

                // Mul                    
                // a . 0 = 0
                "(* (nat 'a) (nat 0) (nat 0) ')" +

                // a . S(b) = a + (a . b)
                "(* (nat 'a) (nat (nat 'b)) 'r (list (+ (nat 'a) 'rm 'r ') (list (* (nat 'a) (nat 'b) 'rm ') (list))))"
            );

            // 0 * 0 = 0
            should(utils.tableFieldsToString(query(
                "(* (nat 0) (nat 0) 'r ')"
            ))).eql({
                query: '?(* (nat 0) (nat 0) \'r \'x$0)',
                result: [
                    {
                      bound: [ 'a', 'r', 'x$0', 'x$1' ],
                      vars: { a: '0', r: '(nat 0)', x$0: '', x$1: '\'x$0' }
                    }
              ]
            });

            
            // 1 * 0 = 0
            should(utils.tableFieldsToString(query(
                "(* (nat (nat 0)) (nat 0) 'r ')"
            ))).eql({
                query: '?(* (nat (nat 0)) (nat 0) \'r \'x$0)',
                result: [
                    {
                      bound: [ 'a', 'n', 'r', 'x$0', 'x$1' ],
                      vars: { a: '(nat 0)', n: '0', r: '(nat 0)', x$0: '\'x$1', x$1: '' }
                    }
                ]
            });
            
            // 0 * 1 = 0
            should(utils.tableFieldsToString(query(
                "(* (nat 0) (nat (nat 0)) 'r ')"
            ))).eql({
                query: '?(* (nat 0) (nat (nat 0)) \'r \'x$0)',
                result: [
                    {
                      bound: [
                        'a',
                        'b',
                        'item',
                        'n',
                        'r',
                        'rm',
                        'x$0',
                        'x$1',
                        'x$10',
                        'x$2',
                        'x$3',
                        'x$4',
                        'x$5',
                        'x$6',
                        'x$7',
                        'x$8',
                        'x$9'
                      ],
                      vars: {
                        a: '\'x$7',
                        b: '0',
                        item: '(+ (nat \'a) \'rm \'x$2 \'x$3)',
                        n: '0',
                        r: '\'x$2',
                        rm: '(nat 0)',
                        x$0: '(list (+ (nat \'a) \'rm \'x$2 \'x$3) (list (* (nat \'a) (nat \'b) \'rm \'x$1) (list)))',
                        x$1: '\'x$10',
                        x$10: '',
                        x$2: '(nat \'x$7)',
                        x$3: '\'x$6',
                        x$4: '(list)',
                        x$5: '(* (nat \'a) (nat \'b) \'rm \'x$1)',
                        x$6: '',
                        x$7: '0',
                        x$8: '(* (nat \'a) (nat \'b) \'rm \'x$1)',
                        x$9: '\'x$7'
                      }
                    }
                ]
            });

            // 1 * 1 = 1
            should(utils.tableFieldsToString(query(
                "(* (nat (nat 0)) (nat (nat 0)) 'r ')"
            ))).eql({
                query: '?(* (nat (nat 0)) (nat (nat 0)) \'r \'x$0)',
                result: [
                    {
                      bound: [
                        'a',
                        'b',
                        'item',
                        'n',
                        'r',
                        'rm',
                        'x$0',
                        'x$1',
                        'x$10',
                        'x$11',
                        'x$12',
                        'x$13',
                        'x$14',
                        'x$2',
                        'x$3',
                        'x$4',
                        'x$5',
                        'x$6',
                        'x$7',
                        'x$8',
                        'x$9'
                      ],
                      vars: {
                        a: '(nat 0)',
                        b: '0',
                        item: '(+ (nat \'a) \'rm \'x$2 \'x$3)',
                        n: '0',
                        r: '\'x$2',
                        rm: '(nat 0)',
                        x$0: '(list (+ (nat \'a) \'rm \'x$2 \'x$3) (list (* (nat \'a) (nat \'b) \'rm \'x$1) (list)))',
                        x$1: '\'x$12',
                        x$10: '(* (nat \'a) (nat \'b) \'rm \'x$1)',
                        x$11: '\'a',
                        x$12: '',
                        x$13: '0',
                        x$14: '0',
                        x$2: '(nat \'x$8)',
                        x$3: '',
                        x$4: '0',
                        x$5: '(* (nat \'a) (nat \'b) \'rm \'x$1)',
                        x$6: '(list)',
                        x$7: '\'x$3',
                        x$8: '\'a',
                        x$9: '0'
                      }
                    }
                ]
            });
            
            // 2 * 1 = 1
            should(utils.tableFieldsToString(query(
                "(* (nat (nat (nat 0))) (nat (nat 0)) 'r ')"
            ))).eql({
                query: '?(* (nat (nat (nat 0))) (nat (nat 0)) \'r \'x$0)',
                result: [
                    {
                      bound: [
                        'a',
                        'b',
                        'item',
                        'n',
                        'r',
                        'rm',
                        'x$0',
                        'x$1',
                        'x$10',
                        'x$11',
                        'x$12',
                        'x$13',
                        'x$14',
                        'x$15',
                        'x$16',
                        'x$17',
                        'x$18',
                        'x$2',
                        'x$3',
                        'x$4',
                        'x$5',
                        'x$6',
                        'x$7',
                        'x$8',
                        'x$9'
                      ],
                      vars: {
                        a: '\'x$9',
                        b: '0',
                        item: '(+ (nat \'a) \'rm \'x$2 \'x$3)',
                        n: '(nat 0)',
                        r: '\'x$2',
                        rm: '(nat 0)',
                        x$0: '(list (+ (nat \'a) \'rm \'x$2 \'x$3) (list (* (nat \'a) (nat \'b) \'rm \'x$1) (list)))',
                        x$1: '\'x$14',
                        x$10: '(nat 0)',
                        x$11: '0',
                        x$12: '(* (nat \'a) (nat \'b) \'rm \'x$1)',
                        x$13: '\'x$9',
                        x$14: '',
                        x$15: '(nat 0)',
                        x$16: '0',
                        x$17: '(nat 0)',
                        x$18: '0',
                        x$2: '(nat \'x$9)',
                        x$3: '\'x$8',
                        x$4: '0',
                        x$5: '0',
                        x$6: '(* (nat \'a) (nat \'b) \'rm \'x$1)',
                        x$7: '(list)',
                        x$8: '',
                        x$9: '(nat (nat 0))'
                      }
                    }
                ]
            });

            // 1 * 2 = 2
            should(utils.tableFieldsToString(query(
                "(* (nat (nat 0)) (nat (nat (nat 0))) 'r ')"
            ))).eql({
              query: '?(* (nat (nat 0)) (nat (nat (nat 0))) \'r \'x$0)',
              result: [
                {
                  bound: [
                    'a',
                    'b',
                    'item',
                    'n',
                    'r',
                    'rm',
                    'x$0',
                    'x$1',
                    'x$10',
                    'x$11',
                    'x$12',
                    'x$13',
                    'x$14',
                    'x$15',
                    'x$16',
                    'x$17',
                    'x$18',
                    'x$19',
                    'x$2',
                    'x$20',
                    'x$21',
                    'x$22',
                    'x$23',
                    'x$24',
                    'x$25',
                    'x$26',
                    'x$27',
                    'x$28',
                    'x$29',
                    'x$3',
                    'x$30',
                    'x$31',
                    'x$32',
                    'x$33',
                    'x$34',
                    'x$35',
                    'x$36',
                    'x$37',
                    'x$38',
                    'x$4',
                    'x$5',
                    'x$6',
                    'x$7',
                    'x$8',
                    'x$9'
                  ],
                  vars: {
                    a: '\'x$11',
                    b: '(nat 0)',
                    item: '(+ (nat \'a) \'rm \'x$2 \'x$3)',
                    n: '0',
                    r: '\'x$2',
                    rm: '\'x$15',
                    x$0: '(list (+ (nat \'a) \'rm \'x$2 \'x$3) (list (* (nat \'a) (nat \'b) \'rm \'x$1) (list)))',
                    x$1: '(list (+ (nat \'x$14) \'x$18 \'x$15 \'x$16) (list (* (nat \'x$14) (nat \'x$17) \'x$18 \'x$19) (list)))',
                    x$10: '',
                    x$11: '(nat 0)',
                    x$12: '0',
                    x$13: '(* (nat \'a) (nat \'b) \'rm \'x$1)',
                    x$14: '\'x$11',
                    x$15: '(nat (nat \'x$9))',
                    x$16: '\'x$31',
                    x$17: '0',
                    x$18: '(nat 0)',
                    x$19: '',
                    x$2: '(nat \'x$8)',
                    x$20: '0',
                    x$21: '0',
                    x$22: '\'x$9',
                    x$23: '\'x$11',
                    x$24: '\'x$11',
                    x$25: '\'x$10',
                    x$26: '0',
                    x$27: '(* (nat \'x$14) (nat \'x$17) \'x$18 \'x$19)',
                    x$28: '(list)',
                    x$29: '(+ (nat \'x$14) \'x$18 \'x$15 \'x$16)',
                    x$3: '(+ (nat \'x$11) (nat \'x$9) \'x$8 \'x$10)',
                    x$30: '\'x$11',
                    x$31: '',
                    x$32: '0',
                    x$33: '(* (nat \'x$14) (nat \'x$17) \'x$18 \'x$19)',
                    x$34: '\'x$11',
                    x$35: '\'x$19',
                    x$36: '0',
                    x$37: '0',
                    x$38: '\'x$9',
                    x$4: '(nat 0)',
                    x$5: '0',
                    x$6: '(* (nat \'a) (nat \'b) \'rm \'x$1)',
                    x$7: '(list)',
                    x$8: '(nat \'x$23)',
                    x$9: '0'
                  }
                }
              ]
            });

            // 2 * 2
            should(utils.tableFieldsToString(query(
                "(* (nat (nat (nat 0))) (nat (nat (nat 0))) 'r ')"
            ))).eql({
              query: '?(* (nat (nat (nat 0))) (nat (nat (nat 0))) \'r \'x$0)',
              result: [
                {
                  bound: [
                    'a',
                    'b',
                    'item',
                    'n',
                    'r',
                    'rm',
                    'x$0',
                    'x$1',
                    'x$10',
                    'x$11',
                    'x$12',
                    'x$13',
                    'x$14',
                    'x$15',
                    'x$16',
                    'x$17',
                    'x$18',
                    'x$19',
                    'x$2',
                    'x$20',
                    'x$21',
                    'x$22',
                    'x$23',
                    'x$24',
                    'x$25',
                    'x$26',
                    'x$27',
                    'x$28',
                    'x$29',
                    'x$3',
                    'x$30',
                    'x$31',
                    'x$32',
                    'x$33',
                    'x$34',
                    'x$35',
                    'x$36',
                    'x$37',
                    'x$38',
                    'x$39',
                    'x$4',
                    'x$40',
                    'x$41',
                    'x$42',
                    'x$43',
                    'x$44',
                    'x$45',
                    'x$46',
                    'x$47',
                    'x$48',
                    'x$49',
                    'x$5',
                    'x$50',
                    'x$51',
                    'x$52',
                    'x$53',
                    'x$6',
                    'x$7',
                    'x$8',
                    'x$9'
                  ],
                  vars: {
                    a: '\'x$12',
                    b: '(nat 0)',
                    item: '(+ (nat \'a) \'rm \'x$2 \'x$3)',
                    n: '(nat 0)',
                    r: '(nat \'x$9)',
                    rm: '(nat (nat \'x$10))',
                    x$0: '(list (+ (nat \'a) \'rm \'x$2 \'x$3) (list (* (nat \'a) (nat \'b) \'rm \'x$1) (list)))',
                    x$1: '(list (+ (nat \'x$16) \'x$20 \'x$17 \'x$18) (list (* (nat \'x$16) (nat \'x$19) \'x$20 \'x$21) (list)))',
                    x$10: '(nat \'x$26)',
                    x$11: '(+ (nat \'x$29) (nat \'x$30) \'x$28 \'x$31)',
                    x$12: '(nat (nat 0))',
                    x$13: '(nat 0)',
                    x$14: '0',
                    x$15: '(* (nat \'a) (nat \'b) \'rm \'x$1)',
                    x$16: '\'x$12',
                    x$17: '\'rm',
                    x$18: '\'x$38',
                    x$19: '0',
                    x$2: '\'r',
                    x$20: '(nat 0)',
                    x$21: '',
                    x$22: '(nat 0)',
                    x$23: '0',
                    x$24: '0',
                    x$25: '\'x$10',
                    x$26: '0',
                    x$27: '\'x$28',
                    x$28: '(nat \'x$44)',
                    x$29: '\'x$12',
                    x$3: '(+ (nat \'x$12) (nat \'x$10) \'x$9 \'x$11)',
                    x$30: '\'x$26',
                    x$31: '\'x$47',
                    x$32: '(nat 0)',
                    x$33: '\'x$26',
                    x$34: '(* (nat \'x$16) (nat \'x$19) \'x$20 \'x$21)',
                    x$35: '(list)',
                    x$36: '(+ (nat \'x$16) \'x$20 \'x$17 \'x$18)',
                    x$37: '\'x$12',
                    x$38: '',
                    x$39: '(nat 0)',
                    x$4: '0',
                    x$40: '(* (nat \'x$16) (nat \'x$19) \'x$20 \'x$21)',
                    x$41: '\'x$12',
                    x$42: '\'x$21',
                    x$43: '(nat 0)',
                    x$44: '\'x$12',
                    x$45: '0',
                    x$46: '\'x$12',
                    x$47: '',
                    x$48: '(nat 0)',
                    x$49: '\'x$10',
                    x$5: '(nat 0)',
                    x$50: '\'x$26',
                    x$51: '(nat 0)',
                    x$52: '0',
                    x$53: '0',
                    x$6: '0',
                    x$7: '(* (nat \'a) (nat \'b) \'rm \'x$1)',
                    x$8: '(list)',
                    x$9: '(nat \'x$27)'
                  }
                }
              ]
            });
/*
            // 2 * 3 = 6
            should(utils.tableFieldsToString(query(
                "(* (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) 'r ')"
            ))).eql(["(* (nat (nat (nat 0))) (nat (nat (nat (nat 0)))) 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0))))))) ' = (list (+ (nat 'a = (nat (nat 0))) 'rm = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0))))) 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0))))))) ' = (+ (nat 'a = (nat (nat 0))) (nat 'b = (nat 'a = (nat (nat 0)))) 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0)))))) ' = (+ (nat 'a = (nat (nat 0))) (nat 'b = (nat (nat 0))) 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0))))) ' = (+ (nat 'a = (nat (nat 0))) (nat 'b = (nat 0)) 'r = (nat 'r = (nat 'a = (nat (nat 0)))) ' = (+ (nat 'a = (nat (nat 0))) (nat 'b = 0) 'r = (nat 'a = (nat (nat 0))) '))))) (list (* (nat 'a = (nat (nat 0))) (nat 'b = (nat (nat 0))) 'rm = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0))))) ' = (list (+ (nat 'a = (nat (nat 0))) 'rm = (nat 'a = (nat (nat 0))) 'r = (nat 'r = (nat 'r = (nat 'a = (nat (nat 0))))) ' = (+ (nat 'a = (nat (nat 0))) (nat 'b = (nat 0)) 'r = (nat 'r = (nat 'a = (nat (nat 0)))) ' = (+ (nat 'a = (nat (nat 0))) (nat 'b = 0) 'r = (nat 'a = (nat (nat 0))) '))) (list (* (nat 'a = (nat (nat 0))) (nat 'b = (nat 0)) 'rm = (nat 'a = (nat (nat 0))) ' = (list (+ (nat 'a = (nat (nat 0))) 'rm = (nat 0) 'r = (nat 'a = (nat (nat 0))) ') (list (* (nat 'a = (nat (nat 0))) (nat 'b = 0) 'rm = (nat 0) ') (list)))) (list)))) (list))))"]);
*/
            // 3 * 2 = 6
            should(utils.tableFieldsToString(query(
                "(* (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) 'r ')"
            ))).eql({
              query: '?(* (nat (nat (nat (nat 0)))) (nat (nat (nat 0))) \'r \'x$0)',
              result: [
                {
                  bound: [
                    'a',
                    'b',
                    'item',
                    'n',
                    'r',
                    'rm',
                    'x$0',
                    'x$1',
                    'x$10',
                    'x$11',
                    'x$12',
                    'x$13',
                    'x$14',
                    'x$15',
                    'x$16',
                    'x$17',
                    'x$18',
                    'x$19',
                    'x$2',
                    'x$20',
                    'x$21',
                    'x$22',
                    'x$23',
                    'x$24',
                    'x$25',
                    'x$26',
                    'x$27',
                    'x$28',
                    'x$29',
                    'x$3',
                    'x$30',
                    'x$31',
                    'x$32',
                    'x$33',
                    'x$34',
                    'x$35',
                    'x$36',
                    'x$37',
                    'x$38',
                    'x$39',
                    'x$4',
                    'x$40',
                    'x$41',
                    'x$42',
                    'x$43',
                    'x$44',
                    'x$45',
                    'x$46',
                    'x$47',
                    'x$48',
                    'x$49',
                    'x$5',
                    'x$50',
                    'x$51',
                    'x$52',
                    'x$53',
                    'x$54',
                    'x$55',
                    'x$56',
                    'x$57',
                    'x$58',
                    'x$59',
                    'x$6',
                    'x$60',
                    'x$61',
                    'x$62',
                    'x$63',
                    'x$64',
                    'x$65',
                    'x$66',
                    'x$67',
                    'x$68',
                    'x$69',
                    'x$7',
                    'x$70',
                    'x$8',
                    'x$9',
                  ],
                  vars: {
                    a: '(nat (nat (nat 0)))',
                    b: '(nat 0)',
                    item: '(+ (nat \'a) \'rm \'x$2 \'x$3)',
                    n: '(nat (nat 0))',
                    r: '(nat \'x$10)',
                    rm: '(nat (nat \'x$11))',
                    x$0: '(list (+ (nat \'a) \'rm \'x$2 \'x$3) (list (* (nat \'a) (nat \'b) \'rm \'x$1) (list)))',
                    x$1: '(list (+ (nat \'x$18) \'x$22 \'x$19 \'x$20) (list (* (nat \'x$18) (nat \'x$21) \'x$22 \'x$23) (list)))',
                    x$10: '(nat \'x$30)',
                    x$11: '\'x$28',
                    x$12: '(+ (nat \'x$32) (nat \'x$33) \'x$31 \'x$34)',
                    x$13: '\'a',
                    x$14: '(nat (nat 0))',
                    x$15: '(nat 0)',
                    x$16: '0',
                    x$17: '(* (nat \'a) (nat \'b) \'rm \'x$1)',
                    x$18: '\'a',
                    x$19: '\'rm',
                    x$2: '\'r',
                    x$20: '',
                    x$21: '0',
                    x$22: '(nat 0)',
                    x$23: '\'x$45',
                    x$24: '(nat (nat 0))',
                    x$25: '0',
                    x$26: '(nat 0)',
                    x$27: '0',
                    x$28: '(nat \'x$29)',
                    x$29: '\'x$33',
                    x$3: '(+ (nat \'x$13) (nat \'x$11) \'x$10 \'x$12)',
                    x$30: '(nat \'x$48)',
                    x$31: '\'x$30',
                    x$32: '\'a',
                    x$33: '(nat 0)',
                    x$34: '(+ (nat \'x$52) (nat \'x$53) \'x$51 \'x$54)',
                    x$35: '(nat (nat 0))',
                    x$36: '\'x$33',
                    x$37: '(* (nat \'x$18) (nat \'x$21) \'x$22 \'x$23)',
                    x$38: '(list)',
                    x$39: '(+ (nat \'x$18) \'x$22 \'x$19 \'x$20)',
                    x$4: '(nat 0)',
                    x$40: '\'a',
                    x$41: '\'x$20',
                    x$42: '(nat (nat 0))',
                    x$43: '(* (nat \'x$18) (nat \'x$21) \'x$22 \'x$23)',
                    x$44: '\'a',
                    x$45: '',
                    x$46: '(nat (nat 0))',
                    x$47: '0',
                    x$48: '\'x$51',
                    x$49: '(nat 0)',
                    x$5: '0',
                    x$50: '0',
                    x$51: '(nat \'x$59)',
                    x$52: '\'a',
                    x$53: '0',
                    x$54: '',
                    x$55: '(nat (nat 0))',
                    x$56: '0',
                    x$57: '\'x$28',
                    x$58: '\'x$33',
                    x$59: '\'a',
                    x$6: '(nat 0)',
                    x$60: '(nat 0)',
                    x$61: '0',
                    x$62: '\'a',
                    x$63: '\'x$54',
                    x$64: '(nat (nat 0))',
                    x$65: '0',
                    x$66: '(nat (nat 0))',
                    x$67: '(nat 0)',
                    x$68: '0',
                    x$69: '(nat 0)',
                    x$7: '0',
                    x$70: '0',
                    x$8: '(* (nat \'a) (nat \'b) \'rm \'x$1)',
                    x$9: '(list)'
                  }
                }
              ]
            });
        });

        it('Should declare a factorial func', function () {

            var query = new Z.run(
                // Nat
                "(nat 0)" +
                "(nat (nat 'n))" +

                // Add
                // a . 0 = a,
                "(+ (nat 'a) (nat 0) (nat 'a) ')" +

                // a . S(b) = a + (a . b)
                "(+ (nat 'a) (nat (nat 'b)) (nat 'r) (+ (nat 'a) (nat 'b) 'r '))" +

                // List
                "(list)" +
                "(list 'item (list ' '))" +
                "(list 'item (list))" +

                // Mul                    
                // a . 0 = 0
                "(* (nat 'a) (nat 0) (nat 0) ')" +

                // a . S(b) = a + (a . b)
                "(* (nat 'a) (nat (nat 'b)) 'r (list (+ (nat 'a) 'rm 'r ') (list (* (nat 'a) (nat 'b) 'rm ') (list))))" +

                // 0! = 1
                "(fac (nat 0) (nat (nat 0)) ')" +
                "(fac (nat (nat 'k)) 'n (list (* 'n1 (nat (nat 'k)) 'n ') (list (fac (nat 'k) 'n1 ') (list))))"
            );
            
            // fac(0) = 1
            should(utils.tableFieldsToString(query(
                "(fac (nat 0) 'r ')"
            ))).eql({
                query: '?(fac (nat 0) \'r \'x$0)',
                result: [
                    {
                      bound: [ 'n', 'r', 'x$0', 'x$1' ],
                      vars: { n: '0', r: '(nat (nat 0))', x$0: '', x$1: '\'x$0' }
                    }
                ]
            });

            // fac(1) = 1
            should(utils.tableFieldsToString(query(
                "(fac (nat (nat 0)) 'r ')"
            ))).eql({
              query: '?(fac (nat (nat 0)) \'r \'x$0)',
              result: [
                {
                  bound: [
                    'a',
                    'b',
                    'item',
                    'k',
                    'n',
                    'n1',
                    'r',
                    'rm',
                    'x$0',
                    'x$1',
                    'x$10',
                    'x$11',
                    'x$12',
                    'x$13',
                    'x$14',
                    'x$15',
                    'x$16',
                    'x$17',
                    'x$18',
                    'x$19',
                    'x$2',
                    'x$20',
                    'x$21',
                    'x$22',
                    'x$23',
                    'x$3',
                    'x$4',
                    'x$5',
                    'x$6',
                    'x$7',
                    'x$8',
                    'x$9'
                  ],
                  vars: {
                    a: '\'x$16',
                    b: '\'k',
                    item: '(* \'n1 (nat (nat \'k)) \'n \'x$2)',
                    k: '0',
                    n: '(nat \'x$16)',
                    n1: '(nat \'a)',
                    r: '\'n',
                    rm: '(nat 0)',
                    x$0: '(list (* \'n1 (nat (nat \'k)) \'n \'x$2) (list (fac (nat \'k) \'n1 \'x$1) (list)))',
                    x$1: '\'x$11',
                    x$10: '(fac (nat \'k) \'n1 \'x$1)',
                    x$11: '',
                    x$12: '0',
                    x$13: '(list)',
                    x$14: '(* (nat \'a) (nat \'b) \'rm \'x$8)',
                    x$15: '(+ (nat \'a) \'rm \'x$6 \'x$7)',
                    x$16: '(nat 0)',
                    x$17: '',
                    x$18: '0',
                    x$19: '(* (nat \'a) (nat \'b) \'rm \'x$8)',
                    x$2: '(list (+ (nat \'a) \'rm \'x$6 \'x$7) (list (* (nat \'a) (nat \'b) \'rm \'x$8) (list)))',
                    x$20: '\'x$16',
                    x$21: '',
                    x$22: '0',
                    x$23: '0',
                    x$3: '0',
                    x$4: '(fac (nat \'k) \'n1 \'x$1)',
                    x$5: '(list)',
                    x$6: '\'n',
                    x$7: '\'x$17',
                    x$8: '\'x$21',
                    x$9: '\'k'
                  }
                }
              ]
            });

            // fac(2) = 2
            /*
            should(utils.tableFieldsToString(query(
                "(fac (nat (nat (nat 0))) 'r ')", 10
            ))).eql(["(fac (nat (nat (nat 0))) 'r = (nat 'r = (nat 'a = (nat 0))) ' = (list (* 'n1 = (nat 'a = (nat 0)) (nat (nat 'k = (nat 0))) 'n = (nat 'r = (nat 'a = (nat 0))) ' = (list (+ (nat 'a = (nat 0)) 'rm = (nat 'a = (nat 0)) 'r = (nat 'r = (nat 'a = (nat 0))) ' = (+ (nat 'a = (nat 0)) (nat 'b = 0) 'r = (nat 'a = (nat 0)) ')) (list (* (nat 'a = (nat 0)) (nat 'b = (nat 0)) 'rm = (nat 'a = (nat 0)) ' = (list (+ (nat 'a = (nat 0)) 'rm = (nat 0) 'r = (nat 'a = (nat 0)) ') (list (* (nat 'a = (nat 0)) (nat 'b = 0) 'rm = (nat 0) ') (list)))) (list)))) (list (fac (nat 'k = (nat 0)) 'n1 = (nat 'a = (nat 0)) ' = (list (* 'n1 = (nat (nat 0)) (nat (nat 'k = 0)) 'n = (nat 'a = (nat 0)) ' = (list (+ (nat 'a = (nat 0)) 'rm = (nat 0) 'r = (nat 'a = (nat 0)) ') (list (* (nat 'a = (nat 0)) (nat 'b = 0) 'rm = (nat 0) ') (list)))) (list (fac (nat 'k = 0) 'n1 = (nat (nat 0)) ') (list)))) (list))))"]);

            // fac(3) = 6
            should(utils.tableFieldsToString(query(
                "(fac (nat (nat (nat (nat 0)))) 'r ')"
            ))).eql(["(fac (nat (nat (nat (nat 0)))) 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0))))))) ' = (list (* 'n1 = (nat 'a = (nat 'a = (nat 0))) (nat (nat 'k = (nat (nat 0)))) 'n = (nat 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0))))))) ' = (list (+ (nat 'a = (nat 'a = (nat 0))) 'rm = (nat 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0))))) 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0))))))) ' = (+ (nat 'a = (nat 'a = (nat 0))) (nat 'b = (nat 'a = (nat 'a = (nat 0)))) 'r = (nat 'r = (nat 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0)))))) ' = (+ (nat 'a = (nat 'a = (nat 0))) (nat 'b = (nat 'a = (nat 0))) 'r = (nat 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0))))) ' = (+ (nat 'a = (nat 'a = (nat 0))) (nat 'b = (nat 0)) 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0)))) ' = (+ (nat 'a = (nat 'a = (nat 0))) (nat 'b = 0) 'r = (nat 'a = (nat 'a = (nat 0))) '))))) (list (* (nat 'a = (nat 'a = (nat 0))) (nat 'b = (nat (nat 0))) 'rm = (nat 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0))))) ' = (list (+ (nat 'a = (nat 'a = (nat 0))) 'rm = (nat 'a = (nat 'a = (nat 0))) 'r = (nat 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0))))) ' = (+ (nat 'a = (nat 'a = (nat 0))) (nat 'b = (nat 0)) 'r = (nat 'r = (nat 'a = (nat 'a = (nat 0)))) ' = (+ (nat 'a = (nat 'a = (nat 0))) (nat 'b = 0) 'r = (nat 'a = (nat 'a = (nat 0))) '))) (list (* (nat 'a = (nat 'a = (nat 0))) (nat 'b = (nat 0)) 'rm = (nat 'a = (nat 'a = (nat 0))) ' = (list (+ (nat 'a = (nat 'a = (nat 0))) 'rm = (nat 0) 'r = (nat 'a = (nat 'a = (nat 0))) ') (list (* (nat 'a = (nat 'a = (nat 0))) (nat 'b = 0) 'rm = (nat 0) ') (list)))) (list)))) (list)))) (list (fac (nat 'k = (nat (nat 0))) 'n1 = (nat 'a = (nat 'a = (nat 0))) ' = (list (* 'n1 = (nat 'a = (nat 0)) (nat (nat 'k = (nat 0))) 'n = (nat 'a = (nat 'a = (nat 0))) ' = (list (+ (nat 'a = (nat 0)) 'rm = (nat 'a = (nat 0)) 'r = (nat 'a = (nat 'a = (nat 0))) ' = (+ (nat 'a = (nat 0)) (nat 'b = 0) 'r = (nat 'a = (nat 0)) ')) (list (* (nat 'a = (nat 0)) (nat 'b = (nat 0)) 'rm = (nat 'a = (nat 0)) ' = (list (+ (nat 'a = (nat 0)) 'rm = (nat 0) 'r = (nat 'a = (nat 0)) ') (list (* (nat 'a = (nat 0)) (nat 'b = 0) 'rm = (nat 0) ') (list)))) (list)))) (list (fac (nat 'k = (nat 0)) 'n1 = (nat 'a = (nat 0)) ' = (list (* 'n1 = (nat (nat 0)) (nat (nat 'k = 0)) 'n = (nat 'a = (nat 0)) ' = (list (+ (nat 'a = (nat 0)) 'rm = (nat 0) 'r = (nat 'a = (nat 0)) ') (list (* (nat 'a = (nat 0)) (nat 'b = 0) 'rm = (nat 0) ') (list)))) (list (fac (nat 'k = 0) 'n1 = (nat (nat 0)) ') (list)))) (list)))) (list))))"]);
            */

        });
    });
});