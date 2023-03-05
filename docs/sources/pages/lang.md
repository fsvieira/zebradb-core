# Zebradb Language

Zebradb has a single language (zlang) for definitions and queries. 
The following sections describes this language.

## Comments

C-style, shell-style

* examples:
```
/*
    Multiline comment

*/
```

```
    # single line comment.
```

## Constants 

A string that does not include comments, ', (), {} and whitespaces.

* examples
```
    yellow red 0 1 , [ ] . = ...
```

## Variables

Variables start with ' and can be followed by varname

* examples

```
    'a   
    # its variable "a"
```

```
    ' 
    # anonimous variable
```

### domains

Domains are sets of constants (eg. {1 2 3 4}) that are associated to a variable. 

* examples

```
    '{0 1 2 3}   
    # anonimous variable can only be assigned to values 0, 1, 2 or 3.
```

```
    'color{blue pink black}  
    # variable color can only be assigned to values blue, pink and black.
```

For aesthetic purposes we can use : to separate the varname and domain, but its exactly the same as above.

```
    'color:{blue pink black}  
    #  variable color can only be assigned to values 0, 1, 2 or 3.
```

### not-unify ~

The not unify is used to say that a variable or zlang term is not unifable 
with other term.

* examples:

```
    'y~'x  
    # it says that variable 'y does not-unify with 'x, 'y != 'x.
```

```
    'y~yellow  
    # it says that variable 'y does not-unify with constant yellow, 'y != yellow.
```

```
    '~yellow  
    # it says that anonimous variable does not-unify with constant yellow, ' != yellow.
```

For aesthetic purposes we can rewrite the above example like this

```
    ~yellow  
    #  it says that anonimous variable does not-unify with constant yellow, ' != yellow.
```

```
    'x:{0 1}~'y{0 1}  
    #  it says that 'x != y and both can only have the values 0 or 1, so x=0 then y=1, x=1 then y=0
```

It also suports a list of zlang terms using ~{...}

```
    'x~{'y 'z yellow} 
    # its says that 'x can't be equal to 'y, 'z and constant yellow  
```

```
    'x~{'y~'z} 
    # its says that 'x != 'y, and 'y != 'z  
```

```
    'x~'y~'z 
    # its says that 'x != 'y, and 'y != 'z  
```

## Tuples

Has the name says tuples are tuples of zlang terms (variables, constants, tuples, ...)

* examples:

```
    ('x = 'x) 
    # tuple has 3 elements, 2 'x variables and one "=" constant
```

```
    ('x != ~'x) 
    # tuple has 3 elements, 'x variable, != constant and ~'x anonimous variable that does not-unify with 'x
```

```
    ((blue) != ~(blue)) 
    # not-unify can also be used on tuples.
```

## Definitions and Query

Definitions and queries are only tuples. 

* example:

definitions:

```
    ('x != ~'x)
    ('x = 'x)
```

query:

```
    (blue 'x blue)
```

output:

```
    (blue = blue)
```

1. Zebradb uses unification to evaluate the query, it basicly unifies the querie with the definitions tuple. 
The outer definition tuple is considered a fact, so any tuple that sucessfuly unfies with it is considered to be valid or checked, however definition inner tuples are not considered to be a fact and so unified tuples are not automaticly checked.
This means that defintion inner tuples must be unifiable with other definitions.

* example:
```
    ((bit 'x) = (bit 'x))
```
    
All queries to this set of definitions will fail because tuple (bit 'x)  does not unify with any definition.
It can be fixed like this:

```
    (bit 'x:{0 1})
    ((bit 'x) = (bit 'x))
```


2. After all queries tuples are checked a solution is found.

### Hidden {}

A hidden list of tuples is preceded by the definition/query tuple like this:

* example:
```
    (mary likes food)
    (mary likes wine)

    # john likes what mary likes.
    (john likes 'stuff) {(mary likes 'stuff)}

```

### A word about recursion

It may not be obvious but its possible to make recursive defintions, here is an example of inductive type nat:

```
    (nat 0)
    (nat (nat 'x))
```

And a simple query:
```
    (nat (nat (nat 0)))
```

An infinity query:
```
    (nat 'x)
```

This query will return all numbers:

```
    (nat 0) # 0
    (nat (nat 0)) # 1
    (nat (nat (nat 0))) # 2
    ...
    (nat ...) # Infinity
```

Unless there is a stop condition recursive queries can run forever. 