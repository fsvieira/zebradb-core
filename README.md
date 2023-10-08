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

## Documentation
[Architecture](documentation/architecture.md)

# The Zebradb Language
Zebradb features a unified language for defining data structures and querying them, known as zlang. In the sections that follow, we will provide a detailed description of this language, covering its syntax and semantics.

## Comments
Zebradb supports both C-style multiline comments and shell-style single-line comments.

### C-style comments
C-style comments begin with /* and end with */. They can span multiple lines and are often used to provide detailed descriptions of code.

Example:

```
/*
This is a multiline comment that can span several lines.
It can be used to provide documentation for 
definitions and queries.
*/
```
### Shell-style comments
Shell-style comments begin with # and end with a new line. They are used for comments that span a single line.

Example:

```
# This is a single-line comment.
```

Comments can be used to make code more readable and maintainable, and to provide additional information for others who may be working with the code.


## Constants
A constant is a string of characters that does not include comments, quotes ('), parentheses (()) , curly braces ({}), square brackets ([]), or whitespace. It can include letters, numbers, and certain special characters, such as ., ,, =, +, -, *, /, ?, and !.

Examples of constants in zlang include:

```
yellow red 0 1 , [] . = ...
```
Note that constants are case sensitive and cannot contain spaces or other whitespace characters.

## Variables
In Zebradb, variables always start with the apostrophe symbol (') and can be followed by a variable name. An anonymous variable can also be used by using only the apostrophe symbol.

Examples:
```
'a   # this is a variable with the name "a"
'    # this is an anonymous variable
```

### Domains
Domains are sets of constants (e.g., {1 2 3 4}) that are associated with a variable.

Examples:
```
'{0 1 2 3}   
# Anonymous variable that can only be assigned to values 0, 1, 2 or 3.

'color{blue pink black}  
# Variable "color" that can only be assigned to values blue, pink, and black.

'color:{blue pink black}  
# Same as above but with ":" for aesthetic purposes.
```

### Not-Unify Operator: ~
The not-unify operator is used to indicate that a variable or zlang term cannot be unified with another term.

Examples:
```
'y~'x  
# This says that variable 'y cannot be unified with 'x, meaning that 'y must be different from 'x.
```

```
'y~yellow  
# This says that variable 'y cannot be unified with the constant 'yellow', meaning that 'y must be different from 'yellow'.
```

```
'~yellow  
# This says that the anonymous variable cannot be unified with the constant 'yellow', meaning that it cannot have the same value as 'yellow'.
```

For aesthetic purposes, the above example can be rewritten as:

```
~yellow  
# This says that the anonymous variable cannot be unified with the constant 'yellow', meaning that it cannot have the same value as 'yellow'.
```

```
'x:{0 1}~'y:{0 1}  
# This says that 'x and 'y cannot be the same, and both can only have the values 0 or 1. So, if 'x is 0, then 'y must be 1, and vice versa.
```

The not-unify operator also supports a list of zlang terms using ~{...}:

```
'x~{'y 'z yellow} 
# This says that 'x cannot have the same value as 'y, 'z, or the constant 'yellow'.
```

```
'x~{'y~'z} 
# This says that 'x cannot have the same value as 'y, and 'y cannot have the same value as 'z.
```

```
'x~'y~'z 
# This says that 'x cannot have the same value as 'y, and 'y cannot have the same value as 'z.
```

## Tuples
Tuples are collections of zlang terms, including variables, constants, and even other tuples.

Examples:
```
('x = 'x) 
# This tuple has 3 elements: two 'x variables and one "=" constant.
```

```
('x != ~'x) 
# This tuple has 3 elements: one 'x variable, one "!=" constant, and one ~'x anonimous variable that does not unify with 'x.
```

```
((blue) != ~(blue)) 
# Not-unify can also be used on tuples, like this tuple that has two elements: one "blue" constant and one ~'(blue) anonimous variable that does not unify with "blue".
```

## Definitions and Queries
In Zebradb, definitions and queries are represented as tuples.

### Definitions
A definition tuple contains zlang terms, such as variables, constants, and other tuples.

Examples:
```
('x != ~'x)
('x = 'x)
```

The outermost tuple is considered a fact, and any tuple that successfully unifies with it is considered valid or checked. However, inner tuples are not considered to be facts, and so unified tuples are not automatically checked. This means that inner tuples of a definition must be unifiable with other definitions.

Example:
```
((bit 'x) = (bit 'x))
```

All queries to this set of definitions will fail because the tuple (bit 'x) does not unify with any definition. To fix this, we can add a new definition:

```
(bit 'x:{0 1})
((bit 'x) = (bit 'x))
```

### Queries
A query is a tuple that we want to evaluate against the definitions. Zebradb uses unification to evaluate queries by attempting to unify the query tuple with each definition tuple.

Example:
```
(blue 'x blue)
```

The output of this query is (blue = blue), which means that 'x can be unified with blue.
After all queries are checked, a solution is found.

### Hidden {}
A hidden list of tuples can be added to a definition or query tuple by placing the list in curly braces immediately after the tuple.

example:
Suppose we have the following tuples representing Mary's preferences:

```
(mary likes food)
(mary likes wine)
```

We can then use a hidden list of tuples to express John's preference for what Mary likes:

```
(john likes 'stuff) {(mary likes 'stuff)}
```

Here, the hidden list of tuples {(mary likes 'stuff)} indicates that the variable 'stuff must be assigned a value that Mary likes.

### Recursive Definitions
Recursion is a powerful technique that allows for defining complex structures and relationships. In Zebradb, it is possible to create recursive definitions, where a definition refers to itself. Here is an example of a recursive definition for an inductive type nat:

```
(nat 0)
(nat (nat 'x))
```

The first line states that 0 is a natural number. The second line says that if 'x is a natural number, then (nat 'x) is also a natural number.

To illustrate, consider the following query:

```
(nat (nat (nat 0)))
```

This query asks whether (nat (nat 0)) is itself a natural number. By the second definition, we know that (nat (nat 0)) is indeed a natural number, so the query is true.

It is also possible to create queries that generate an infinite number of results. For instance, consider the query:

```
(nat 'x)
```

This query asks for all natural numbers. The answer is an infinite list of tuples, where each tuple corresponds to a natural number. The first tuple is (nat 0), the second is (nat (nat 0)), the third is (nat (nat (nat 0))), and so on, ad infinitum.

It is important to note that recursive queries can run forever unless there is a stop condition. Thus, it is essential to carefully design recursive definitions to avoid infinite loops.

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

