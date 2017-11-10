# zebrajs

Zebrajs is a logical symbolic computation query system, given a set of computational definitions it will
answer questions about them, therefor Zebrajs is better suited for software validation and constraint satisfaction problems.

Zebrajs system consists of two parts the definitions and the query, both parts share the same language of zebra-system terms, which is defined by
a certain formal syntax, and a set of transformation rules.

The zebra language is very simple, it only has constants, variables, tuples and negation.

But because its hard to explain how it works, I will do it with examples:

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

