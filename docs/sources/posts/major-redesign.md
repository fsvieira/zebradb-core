Zebradb got a major redesign, I think its on the rigth track but is still on 
a heavy experimental phase. Here is a list of the major changes:

  * Its now using <a href="https://github.com/fsvieira/beastdb" target="_blank">beastdb</a> for processing:
    * persists processing data on disk, so in case of stop or crash it can be resumed,
    * better memory handling because not all branches need to be on memory.
  * Added domains, 
  * Added hidden/body to definitions and queries,
  * Added not-unify operator,
  * Put negation-by-failure on hold:
    * Negation-by-failure is much more complicated than not-unify, 
    * Not-unify can solve some of the problems that negation-by-failure solves, but not all,
    * It needs more research.