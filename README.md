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


<h3>Examples, Zebra Puzzle</h3>

At examples/zebra you run with nodejs:

<ul>
<li>solve.js: solve a puzzle stored on a file (templeta or puzzle),</li>
<li>tryfail.js: generate a puzzle template and save it on a file, (templates dont have a random solution, all items are ordered in the same way)</li>
<li>gen_puzzles.js: generate a puzzle from a templates, this will randomize the items, clues and other stuff.</li>
</ul>


<h2>The Puzzle</h2>

First lets define our puzzles. The puzzles are nothing more than a grid size and a list of clues, for example:
<pre>{
"grid":{"w":2,"h":2}, 
"clues":[
  {"type":"immediately to the left of","a":{"v":"var1_0","y":1},"b":{"v":"var1_1","y":1}},
  {"type":"immediately to the left of","a":{"v":"var0_0","y":0},"b":{"v":"var0_1","y":0}}]
}
</pre>
We only considered puzzles with unique solutions, so a puzzle with more than one solution is considered to be invalid.

The puzzles clues are defined with the constrain type and variables related to the constrain, for example:
<pre>  {"type":"immediately to the left of","a":{"v":"var1_0","y":1},"b":{"v":"var1_1","y":1}},
</pre>
On the above case we have a clue with two variables "a" and "b", I call the "v" variable property an item, the goal of the puzzle is to deduce all item position they are defined as a string like this: "var0_0", "var0_1", ...
The names of items are not important, what matters is that the same name refers to the same item.

As I said before the goal of puzzle is to find all item positions, in our puzzles the "y" coordinate is already known and its saved on clue variable as property "y". You can thing of y as a class or group, for example in original zebra puzzle items are organized in category’s like: houses, people, animals, smokes and drinks.
<h2>Solving</h2>
Like I said before the goal of the puzzle is to find all item positions, we already know item y position so we only need to find out the x coordinate value.

To solve the puzzle we are going to create a zebrajs variable (called x) for every clue variable, this variable will be initialized with the domain of all possible x coordinates and with appropriated change events for the item clue.

For example "immediately to the left of" is defined like this:
<pre>
var constrains = {
...
"immediately to the left of": function (grid, a, b) {
		var domain = [];
		for (var i=0; i < grid .w-1; i++) {
			domain.push(i);
		}

		a.x = v({domain:domain});
		
		var domain = [];
		for (var i=1; i < grid.w; i++) {
			domain.push(i);
		}
		
		b.x = v({domain:domain});
		
		b.x.change (function (a) {
			return function (b) {
				var da = a.getValues();
				var db = b.getValues();

				da.forEach (function (x) {
					if (db.indexOf(x+1) === -1) {
						a.setNoValue(x);
					}
				});
			};
		}(a.x));
				
		a.x.change (function (b) {
			return function (a) {
				var da = a.getValues();
				var db = b.getValues();

				db.forEach (function (x) {
					if (da.indexOf(x-1) === -1) {
						b.setNoValue(x);
					}
				});
			};
		}(b.x));
	},
...
}
</pre>
So we call 
<pre>constrains[clue.type] (grid, clue.a, clue.b)</pre>,this function will create the new x variable with the correct domain for every variable.

For example, if a is immediately to the left of b it means that in a grid of 5x5 "a" must be at possible x coordinates [0, 1, 2, 3] and "b" must be at [1, 2, 3, 4].
After creating x variables with corresponding domains we can setup change event on both variables to update related variables, for example if "a" domain changes to [1, 2] than "b" domain must change to [2, 3] because we know that "b" must be immediately to the left of "a".

The last constrain that we need to setup on variables is that for every row "x" variable must have a distinct value, we can easily do it like this:
<code>
<pre>
        function setVars (a, b) {
		if ((a && b) && (a.v!==b.v) && (a.y===b.y)){
			a.x.not_unify(b.x);
		}
	};

	for (var i=0; i < clues.length-1; i++) {
		var clue1 = clues[i];
		for (var j=i+1; j < clues .length; j++) {
			var clue2 = clues[j];
				
			setVars(clue1.a, clue2.a);
			setVars(clue1.a, clue2.b);
			setVars(clue1.b, clue2.a);
			setVars(clue1.b, clue2.b);
		}
	}
</pre>

The code simple compares all clue variables and if they have the same y value and are not the same item ("v") then x variables are distinct and we say they don’t unify.

Now that all variables are created with the correct constrains we just need to unify all equal variables (variables with same item name), we do it like this:

</pre><pre>
        clues.forEach (function (clue, index) {
		items[clue.a.v] = items[clue.a.v] || clue.a.x;
		items[clue.a.v].unify(clue.a.x);
		if (clue.b) {
			items[clue.b.v] = items[clue.b.v] || clue.b.x;	
			items[clue.b.v].unify(clue.b.x);
		}
	});
</pre>

What is happening? Why unifying would solve the puzzle?

Well we have created all variables with the according constrains and domains depending on the type of clues, clue variables are identified by their item name meaning same name refers to same variable so they must be unifiable.

A successful unified variable guaranties that no constrains on any unified variable are break and we can say that constrains are merged.

For example, lets say that we have a item "var0_0" on a "middle" constrain with x domain  [1, 2, 3] and a immediately left constrain with same item "var0_0" and x domain [0, 1, 2, 3], 
since the item is the same for both constrain variables we can unify the x variables and
 since x must be in the middle the result of "var0_0" x coordinates domain would be 
[1, 2, 3], by continuing to unify equal variables we are limiting x coordinate values for that variable (item) and if we end up with only one possible value for x coordinate than 
position is determined.


<h3>Other deductions</h3>

Sometimes not so obviously deduction can be made, for this kind of deductions we use a brute force function called try values. 

The function is very expensive since it will try all possible x variable values and check if any tried value would result on a variable with no values, if this happens than the value is marked as a not unifiable value, restricting the range of x possible values.

Since the function is very expensive I run it after all constrains have been applied, this will limit the number of possible values remaining. 

<pre>
vars.forEach (function (v) {
   v.tryValues(sl);
});
</pre>


<h2>Generating Zebra Puzzles</h2>

The process of finding puzzles can be defined as this: 

<ul>
<li>Let C be the set of all possible constrains</li>
<li>and S = Powerset(C).</li>
<li>for all elements s in S, s is valid puzzle if solve function can find a unique solution using s.   
</ul>

Now as you can imagine the size of search space will increase tremendous when increasing grid size and the number of constrains making it impossible to test all combinations.

I tried different search methods to speed up the search of a solution, I even tried genetic search, but they were taking to long, maybe my heuristic wasn't good enough.

Anyway I using a faster method, its a simple try and fail.

And it simple works like this:

<ol>
<li>We start with a list of all clues,</li>
<li>Shuffle the clues list,<li>
<li>We try to find a clue that can be removed from our clue list (a clue can be removed if we can solve a puzzle with the remaining clues).
</li>
<li>When no more clues can be removed from the list we have found a puzzle and we stop.</li>
<li>If a clue was taken from the list we repeat steps from step 2.</li>
</ol>


Well that’s it happy puzzling ;)





