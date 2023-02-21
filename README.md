# zebradb-core

IMPORTANT: This project is a personal research endeavor, and as such, is subject to ongoing experimentation and evolution. Therefore, certain aspects of the project are likely to change as new insights and discoveries are made.   

The zebradb-core project is a symbolic computation query system, given a set of computational definitions it will
answer questions about them, therefor I think it has the potential to be well-suited for software validation and constraint satisfaction problems, as it helps users find answers to questions based on a set of definitions they provide.

The project API is database alike, and it should be the base of other projects that implement other tools and even a complete database solution.

# Install

## Currently there is no install, to try it just clone this repo and:

```
  npm install
```
```
  mocha
```

## Old Version

This is old version it does work as a lib,  
```
  npm install zebradb-core
```


# Language

Zebrajs language consists of two parts the definitions and the query, both parts share the same language of zebra-system terms, which is defined by
a certain formal syntax, and a set of transformation rules.

The zebra language is very simple, it only has constants, variables, tuples, domains and negation (has not-unify).

## tuples, constants and variables

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
 * ('p & 'q = 'r)

zebra-system is going to match query with all definitons and will unify variables 'p, 'q and 'r with the
values found, on this example we will get the all & table.

So if we do another query like this:
 * ('p & 'q = 1) we will get (1 & 1 = 1).

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

## domains

 * Domains can only contain constants, they work as variables but they only can be unfied 
 with constants that are in the domain.
 
 Example, lets define & operator using domains:
   * ('[0 1] & 0 = 0)
   * ( 0 & '[0 1] = 0)  
   * ( 1 & 1 = 0) 

 Domains are defined like this '\[ ...constants ...\], they 
 use the same ' variables prefix because they are a special case of variables  .  

## negations (~, not-unify)

Now lets make a query with a negation (~):

* ('p | ~'p = 1)

On this query the negation is ~'p, all negations starts with ~.
Negation can be applied to anything tuples, constants and variables, domains. 
They work as a not-unify, when negation is declared it creates a new anonimous variable, 
this variable is not-unifiable with the negated part. 
Example: ~p <=> '_v$1 != 'p

So the result of this query would be:
 * (0 | 1 = 1) => (0 | 1 = 1)
 * (1 | 0 = 1) => (1 | 0 = 1)

So we are excluding (1 | 1 = 1) because 'p = ~'p <=> 1 = 1 is a contradiction.

This are the basics of zebra-system, but because its hard to explain how it works, I will do it with more examples:

## Puting all togheter on a fancy example

Lets define the and operator with negations:

 * ('p & ~'p = 0)
 * ('p & 'p = 'p)  

And now we can query with domains:
  * ('[0 1] & '[0 1] = '[0 1])

  It will give the & results:
  * (0 & 0 = 0)
  * (0 & 1 = 0)
  * (1 & 0 = 0)
  * (1 & 1 = 1)
  
In this case domains are set on query but we can change definitions to have the bit type like this:

  * (bit '[0 1])
  * ((bit 'p) & (bit ~'p) = (bit 0))
  * ((bit 'p) & (bit 'p) = (bit 'p))

  And the query can be like this:
    * ('p & 'q = 'z)
  
  And the results:
  * ((bit 0) & (bit 0) = (bit 0))
  * ((bit 0) & (bit 1) = (bit 0))
  * ((bit 1) & (bit 0) = (bit 0))
  * ((bit 1) & (bit 1) = (bit 1))

### Examples

* Definitions, are considered facts they are always tuples and always global.
  * Ex: (color yellow)
  * In this example color and yellow are constants, constants don't need to be declared anywhere
    because we consider that all constants exists.
* Queries, are questions to the system definitions (facts),
  * Ex: (color yellow)
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
* Negation, has not-unify,
  * Ex:
    * ('x = 'x)
    * ('x != ~'x)
    * (color yellow)
    * (color blue)
    * Query: ((color 'x) != (color 'y))
  * The query should return:
    * ((color blue) != (color yellow))
    * ((color yellow) != (color blue))
  * We are asking for colors that are not equal.
  * Queries and definitions can also have domains, domains can only contains constants and they work as a variable that is restricted to unify only the domains values.

* Thats it.

## Examples
The is a new repository that contains zebrajs examples and a console program to run them.

https://github.com/fsvieira/zebrajs-examples


## Tests

A great source of examples are the test file https://github.com/fsvieira/zebrajs/tree/master/test

* If you want to run the tests:
  * Execute mocha (https://mochajs.org/).
  * You also will need to install should (https://github.com/visionmedia/should.js).

# Projects on Hold/Outdated

* https://github.com/fsvieira/zebrajs-examples
   * It contains a console program to run zebrajs language as .z files, and a few examples.

* https://github.com/fsvieira/raindropz
   * An online IDE to run zebrajs language, currently is only used for debuging.

