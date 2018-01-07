# Zebrajs

Zebrajs is a symbolic computation query system, given a set of computational definitions it will
answer questions about them, therefor Zebrajs is better suited for software validation and constraint satisfaction problems.

# Zebrajs is a library but ...
Its currently incorporated on other projects ready to be used:

* https://github.com/fsvieira/zebrajs-examples
   * It contains a console program to run zebrajs language as .z files, and a few examples.

* https://github.com/fsvieira/raindropz
   * An online IDE to run zebrajs language, currently is only used for debuging.

# Install

```
  npm install zebrajs
```

# Docs
  * Check the wiki (https://github.com/fsvieira/zebrajs/wiki) to get started.

# Language

Zebrajs language consists of two parts the definitions and the query, both parts share the same language of zebra-system terms, which is defined by
a certain formal syntax, and a set of transformation rules.

The zebra language is very simple, it only has constants, variables, tuples and negation.

A math function can be represented as a set of tuples, so on zebra language you can think of tuples has functions, 
for example, the binary function and:
  * &: bin -> bin -> bin
 
Where operatar & can be defined as a table:
 * p q | p & q
 * 0 0 | 0
 * 0 1 | 0
 * 1 0 | 0 
 * 1 1 | 1

On zebra language we define such function like this:
 * (0 & 0 = 0)
 * (0 & 1 = 0)
 * (1 & 0 = 0)
 * (1 & 1 = 1)

The 0, 1, & and = are just simbols (constants) and have no meaning to zebra-system, when we perform 
the query:
 * ?('p & 'q = 'r)

zebra-system is going to match query with all definitons and will unify variables 'p, 'q and 'r with the 
values found, on this example we will get the all & table.

So if we do another query like this:
 * ?('p & 'q = 1) we will get (1 & 1 = 1).

All symbol can be variables, lets define another function:
 * (0 | 0 = 0)
 * (0 | 1 = 1)
 * (1 | 0 = 1)
 * (1 | 1 = 1)

Now we ask the system what operations would give us the result of 1: ?('p 'o 'q = 1), and 
the result would be:
 * (1 & 1 = 1)
 * (0 | 1 = 1)
 * (1 | 0 = 1)
 * (1 | 1 = 1)

Now lets make a query with a negation:

* ?('p | 'q = 1 ^('p & 'q = 1))

On this query the negation is ^('p & 'q = 1), all negations starts with ^, they always negate a tuple, and
they are hidden witch means they are considered for unification.

So the result of this query would be:
 * (0 | 1 = 1 ^(1 & 0 = 1)) => (0 | 1 = 1)
 * (1 | 0 = 1 ^(0 & 1 = 1)) => (1 | 0 = 1)

So we are excluding (1 | 1 = 1) because ^(1 & 1 = 1) exists, witch means negation doesn't fail and so it can't be true.

This are the basics of zebra-system, but because its hard to explain how it works, I will do it with more examples:

Try it online: https://fsvieira.github.io/raindropz/ (Raindropz IDE git: https://github.com/fsvieira/raindropz)

## Examples

* Definitions, are considered facts they are always tuples and always global.
  * Ex: (color yellow)
  * In this example color and yellow are constants, constants don't need to be declared anywhere 
because we consider that all constants exists.
* Queries, are questions to the system definitions (facts),
  * Ex: ?(color yellow)
  * Because definitions/facts are tuples, all querys are also tuples,
  * In this example the system will check if any of the definitions unify with the query,
    if yes the result will be the tuple itself: (color yellow)
  * If there is no awnser then the system will return nothing.
* Queries, may also be inner tuples of queries or definitions
  * The ideia is quite simple, a fact is only valid if all contained tuples are also valid facts.
  * Ex: (man (person 'name) (male 'name) 'name)
    * This fact is invalid because there is no (person 'name) or (male 'name) definitions,
    * Here the 'name is a variable, all variables have the ' as prefix,
    * You can also define anonimous variables, just use ' without a name,
    * If we add the facts:
      * (person filipe)
      * (male filipe)
    * The the fact would be valid and the query:
      * ?(man ' ' 'man), returns:
      * (man (person filipe) (male filipe) filipe)
* Negation, its true if a negated query doesn't exist, negation queries are hidden and are not considered for unification,
  * Ex: 
    * (equal 'x 'x)
    * (color yellow)
    * (color blue)
    * ?(color 'x ^(equal 'x yellow))
  * The query should return:
    * (color blue)[(equal blue yellow)]
  * Where the results in [] are the negations,
  * We are asking for color 'x not to be equal to yellow.
  * Because we are negating a query negation can only be applied to a tuple,
  * Extending the example:
  * (distinct (color 'x) (color 'y) ^(equal 'x 'y))
    * ?(distinct 'x 'y)
  * The query should return:
    * (distinct (color blue) (color yellow))[(equal (color blue) (color yellow)]
    * (distinct (color yellow) (color blue))[(equal (color yellow) (color blue)]

* Thats it.

## Examples
The is a new repository that contains zebrajs examples and a console program to run them.

https://github.com/fsvieira/zebrajs-examples


## Tests

A great source of examples are the test file https://github.com/fsvieira/zebrajs/tree/master/test

* If you want to run the tests:
  * Execute mocha (https://mochajs.org/).
  * You also will need to install should (https://github.com/visionmedia/should.js).

