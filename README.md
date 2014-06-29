zebrajs
=======

Variable Constrains lib

==== 
To run the generator just go to folder examples/zebra and type:

<pre>
nodejs main.js
</pre>

The generator is very slow so it may take several minutes to generate the puzzles.

The puzzles are saved on a file as json format like this:
<pre>
[{"constrains":[{"type":"next to","x":"dunhill","y":"dane"},{"type":"middle","x":"pallmall","y":null},{"type":"next to","x":"white","y":"tea"},{"type":"next to","x":"milk","y":"water"},{"type":"immediately to the left of","x":"water","y":"dog"},{"type":"next to","x":"beer","y":"norwegian"},{"type":"immediately to the left of","x":"prince","y":"horse"},{"type":"immediately to the left of","x":"horse","y":"cats"},{"type":"same position as","x":"yellow","y":"birds"},{"type":"immediately to the left of","x":"swede","y":"zebra"},{"type":"same position as","x":"blue","y":"dog"},{"type":"middle","x":"green","y":null},{"type":"middle","x":"coffee","y":null},{"type":"immediately to the left of","x":"german","y":"bluemaster"},{"type":"middle","x":"english","y":null},{"type":"immediately to the left of","x":"bluemaster","y":"prince"}],"missing":["red","blend"],"solution":{"houses":["yellow","blue","green","white","red"],"drinks":["water","milk","coffee","beer","tea"],"people":["german","swede","english","dane","norwegian"],"smokes":["blend","bluemaster","prince","pallmall","dunhill"],"animal":["birds","dog","zebra","horse","cats"]}}]
</pre>

Its an array of objects, every object is a generated puzzle and contains the following keys:
<ul>
<li>"constrains": the clues of the puzzle, every clue contain the type of the clue and one (x) or two (y) values.</li>
<li>"missing": the values that are missing from the constrains/clues, normally this would be two. For example: "missing":["red","blend"].
<p>Missing values can be presented to user like this:
<ul>
<li>One of the houses is red,</li>
<li>Someone smokes blend.</li>
<li>or as a question: Who lives in red house and who smokes blend.</li>
<li>or in a graphical GUI like grids or something like that you can just present all values and no need to reference the missing values.
</li></ul>
</p>
</li>
<li>"solution": the solution for this puzzle, the solution is on the format of type: [values], for example:
<p>{"houses":["yellow","blue","green","white","red"], "drinks":["water","milk","coffee","beer","tea"], ...}</p>
<p>In this example the people living in yellow house drink water.</p>
</li>
</ul>

Now that I have something working I will try to optimize the lib and generator, first I will try to optimize the algorithms but when that is done I would like to try some web-workers/threads :) that would be fun ahhaha...

Happy coding. 
