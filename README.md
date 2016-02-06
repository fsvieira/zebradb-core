# zebrajs

Zebrajs is a logical symbolic computation query system, given a set of computational definitions it will
answer questions about them, therefor Zebrajs is better suited for software validation and constrain satisfaction problems.

Zebrajs system consists of two parts the definitions and the query, both parts share the same language of zebra-system terms, which is defined by
a certain formal syntax, and a set of transformation rules.

The zebra language is very simple, it only has constants, variables, tuples, negation and ignore.

But because its hard to explain how it works, I will do it with examples:

## Examples

* Defintions, are considered facts they are always tuples and always global.
  * Ex: (color yellow)
  * In this example color and yellow are constants, constants dont need to be declared anywhere 
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
* Negation, is a anonimous variable that can unify with any value except the ones that are negated:
  * Ex: (color ^yellow)
  * This fact is true for any color except yellow,
  * Negation can be used with consants, variables or tuples:
    * Ex: (notYellow ^(color yellow))
* Ignore, will ignore any unification and it will always succed,
  * Ex. if then else: 
    * (if true 'x _ 'x) 
    * (if false _ 'x 'x)
  * We want to ignore the branch that we dont care about, this is specialy good to avoid infinit, failing and unecessary computation. 
* Thats it.


## Tests

A great source of examples are the test file https://github.com/fsvieira/zebrajs/blob/master/test/test.js

* If you want to run the tests:
  * Execute mocha (http://visionmedia.github.io/mocha/).
  * You also will need to install should (https://github.com/visionmedia/should.js).


## History/Road map (WIP)

* 2.0.0 (WIP)
  * Add support to finit representation of infinity structures (ex: (nat 'x) -> 'x => (nat 'x))
* 1.0.0 version
  * Add examples, solve brave puzzle (http://www.mathsisfun.com/puzzles/a-brave-puzzle.html)
* beta version
  * [ ] Optimize (solve all [current] tests under 20 seconds, optimal < 2s),
  * [x] Remove duplicated results,
* alfa version (2015-10-22)
  * [x] Clean up and rename files, functions,
  * [x] Add "multiply" results support,
  * [x] Fix tools,
  * [x] Fix imports and zlib tests,
  * [x] Add ignore "_" term support.


** pre-alfa version **
  The first version was a implementation of variables as js objects with some features of unification,
  the ideia was to provide flexible tools to let the programmer choose their own search algoritms.
  The problem with this aproach is that the system only have partial information of the 
  problem is trying to solve, so it is very restricted on decisions that it can make.
  This makes it hard to optmize the system so I decided to resutruct next version of the system and give him
  full control and information.


