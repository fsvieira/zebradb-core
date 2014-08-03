<h1>zebrajs</h1>

zebrajs is a constrain problem solving lib made in javascript. The goal of the lib is to provide tools to solve constrain problems like sudoku, zebra (aka Einstein puzzle) or any other problem defined with constrains.

The zebrajs variables are defined in a way that they dont depend on any search algoritm leting users to define their own methods: such as deep search, backtracking, genetic search. Rigth now only genetic search is implemented as part of the lib, hopefully with time it will get more search methods. 

The core of zebra lib are the variables, there is a few things that you can do with them:

<h3>Create a Variable</h3>
After importing variables lib, you can create a variable like this:
<pre>
var a = v();
</pre>

You can initialize a variable by passing a options object to the constructor, you can pass value and domain:

<ul>
<li>value (optional): the value of the variable,</li>
<li>domain (optional): an array of possible values that the variable can take.</li>
</ul>

Examples:
<pre>
var a = v();
var b = v({value: "blue"});
var c = v({domain: ["red", "blue", "green"]});
var d = v({value: "blue", domain: ["red", "blue", "green"]});
</pre>

<h3>Get value</h3>
The function getValue(), returns the variable value or undefined if variable as no value.
A variables with no initial value can return a value depending on variable manipulation and constrains.

<pre>
var a = v();
var b = v({value: "blue"});
var c = v({domain: ["red", "blue", "green"]});
var d = v({value: "blue", domain: ["red", "blue", "green"]});
console.log(a.getValue()); // undefined
console.log(b.getValue()); // "blue"
console.log(c.getValue()); // undefined
console.log(d.getValue()); // "blue"
</pre>

<h3>Unify</h3>

A variable can be unified with other var like this:
<pre>
var a = v();
var b = v();
console.log(a.unify(b)); // true
</pre>

Variable unification is like saying that variables are the same, meaning that if one of the unified vars get a value all other vars will have the same value.

Not all variables can be unified, a variable can only be successful unified if doesn’t break any constrains, for example:
<pre>
var a = v({value: "blue"});
var b = v({value: "yellow"});
console.log(a.unify(b)); // false
</pre>

a and b can't be unified because they have different values.

Other example: 
<pre>
var a = v();
var b = v({value: "blue"});
a.unify (b);
console.log(a.getValue()); // "blue"
</pre>

After unifying var a with b, a will get the b value.

A more interesting example:
<pre>
var a = v([{domain: [1, 2, 3]});
var b = v([{domain: [3, 4, 5]});

console.log(a.getValue()); // undefined
console.log(b.getValue()); // undefined

a.unify(b);
console.log(a.getValue()); // 3
console.log(b.getValue()); // 3
</pre>

Variable a and b, are initialized with possible values, but with no actual value. 
After a is unified with b, the only possible value that a and b share is 3, since they must have the same value a and b can only be 3.

<h3>Set Value</h3>
A variable value can be set on initialization (always successful) or after initialization using setValue() function, like unify 
a value can only be set if it doesn't break any constrain. 

Example:
<pre>
var a = v();
var b = v();
a.unify(b);
console.log(a.setValue("blue")); // true
console.log(b.setValue("yellow")); // false
</pre>

a and b start with no values and then a is unified with b, after a is set with value "blue" b will also have the same value "blue", so setting b as "yellow" will
fail. 

<h3>Not Unify</h3>

The function notUnify, sets a constrain on both variables than they can not have the same value.

Example:
<pre>
var a = v();
var b = v();
a.notUnify(b);
console.log(a.setValue("blue")); // true
console.log(b.setValue("blue")); // false
</pre>

a and b start with no values, and notUnify makes a and b distinct, meaning they cant have the same value, next variable a is set to value "blue" with success, 
but setting b to same value ("blue") will fail, since a and b cant have the same value.

* notUnify also affects unify behaviour, and unify affects notUnify behaviour.

Example: 
<pre>
var a = v();
var b = v();
var c = v();
console.log(a.notUnify(b)); // true
console.log(b.unify(c)); // true
console.log(a.unify(c)); // false
</pre>

First a is set not to unify with b (a =/= b), next b is set to unify with c (b=c), so if a=/=b and b=c then a must be different from c, so unifying var a with c fails.

<h3>Set no value</h3>
The function setNoValue is used to discard possible values from the variable.

Example:
<pre>
var a = v({domain: ["yellow", "blue", "red"]});
console.log(a.getValue()); // undefined
a.setNoValue("yellow");
a.setNoValue("red");
console.log(a.getValue()); // "blue"
</pre>

The variable a is declared with possible values "yellow", "blue" and "red", after discarding possible values "yellow" and "red", a can only be "blue". 

<h3>Get Values</h3>
The getValues functions will return all variable possible values (not the same as domain).

Example: 
<pre>
var a = v({domain: ["yellow", "blue", "red"]});
console.log(a.getValue()); // undefined
a.setNoValue("yellow");
console.log(a.getValues()); // ["blue", "red"]
</pre> 

While var a domain is "yellow", "blue" and "red", after discarding "yellow" as a possible value the only possible values remaining are "blue" and "red".

<h3>Try Values</h3>
TryValues function is a brute force function that will try all possible variable values and check if other constrained variables hold (if they are guaranteed to have a value). 

Example:
<pre>
var a = v(domain: ["yellow", "blue", "red", "white", "green"]);
var b = v(domain: ["blue", "red", "white"]);
var c = v(domain: ["blue", "red", "white"]);
var d = v(domain: ["blue", "red", "white"]);
var e = v(domain: ["yellow", "blue", "red", "white", "green"]);

a.notUnify(b);
a.notUnify(c);
a.notUnify(d);
a.notUnify(e);

b.notUnify(c);
b.notUnify(d);
b.notUnify(e);

c.notUnify(d);
c.notUnify(e);

d.notUnify(e);

a.tryValues();
console.log(a.getValues()); // ["yellow", "green"]
</pre>

The notUnify sets vars a, b, c, d and e as distinct, meaning they cant have the same value.

the a.tryValues will try to set all possible a values, and do the same to other vars, checking if all other vars still have at least on possible value. 
For example, a=yellow, b=blue, c=red, d=white and e="green" , is a possible outcome so yellow is a possible value. 
But in case a=blue, b=red, c=white, but d cant be set to any value, even if we set b=white and c=red, d will still have no possible value so a cant be blue.

When tryValues end a can only have two possible values yellow and green.

<h3>Events: onchange</h3>
A function can be set to be triggered when a variable changes, a variable is considered to change if is value is change or possible values change.

Exemple: 
<pre>
var a = v({domain: ["blue", "red", "yellow"]});
a.onchange(function (v) {
  console.log(v.getValues());
});

a.setNoValue("yellow"); // it will trigger function that will print ["blue", "red"]
</pre>

<h3>cloneShare</h3>

The cloneShare methods clone the variable share object, this object keeps track of variable state and its shared on all unified variables, so this function can be used to save and restore variables state.

See examples/zebra/genetic_search.js for a example on how to save and load variables. 


<h1>Thats almost it,</h1>
I also made a genetic search algorithm and a example to generate zebra puzzles.


Happy coding ;)




