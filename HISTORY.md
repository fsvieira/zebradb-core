# Road map (WIP)

* 2.0.0 (WIP)
  * Add support to finit representation of infinity structures (ex: (nat 'x) -> 'x => (nat 'x))
* 1.0.0 version
  * [ ] Update documentation, 
  * [ ] Lint code,
    * [ ] Add code guidelines
  * [ ] Improve Planner,
  * [ ] Add Multithread support (workers, ...),
  * [ ] Improve space:
    * [ ] Add database,
    * [ ] Remove recursive calls.
* beta version (new)
  * [ ] Update documentation,
  * [X] get all examples working,
  * [X] get all tests working,
  * [X] move roadmap/history to HISTORY.md,
  * [X] add include file to z language, eg: [list],
    * [X] suport for custom file driver, default to node fs.
  * [X] multiply definitions (remove multiply results)

# History

** beta version (2016-03-07) **
  
  This version had a few things that I had to rethink, so the changes to the new version are:
  
  * The "not" was a not by value and I decided to replace it with a "not exist", this means that I negate a query
  insted a value. I think this kind of not is more versatil and much more clear. Also the "not exists" works 
  like a condition and not as part of the result. 
  
  * The ignore was removed but only becase at this phase I need to get a stable version and than reavaluate the 
  need of the ignore.
  
  * Optimize the way data was stored, I implemented version system with immutable data.

* beta version (2016-03-07)
  * [x] Optimize (solve all [current] tests under 20 seconds, optimal < 2s),
  * [x] Remove duplicated results,
* alfa version (2015-10-22)
  * [x] Clean up and rename files, functions,
  * [x] Add "multiply" results support,
  * [x] Fix tools,
  * [x] Fix imports and zlib tests,
  * [x] Add ignore "_" term support.

** pre-alfa version **
  
  The first version was a implementation of variables as js objects with some features of unification,
  the ideia was
  to provide flexible tools to let the programmer choose their own search algoritms.
  The problem with this aproach is that the system only have partial information of the 
  problem is trying to solve, so it is very restricted on decisions that it can make.
  This makes it hard to optmize the system so I decided to resutruct next version of the system and give him
  full control and information.


