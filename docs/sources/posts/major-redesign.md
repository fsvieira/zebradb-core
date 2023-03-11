Zebradb has undergone a major redesign and is currently in a heavy experimental phase, although I believe it's on the right track. The following are the major changes that have been implemented:

  * <a href="https://github.com/fsvieira/beastdb" target="_blank">BeastDB</a> is now being used for processing, which persists processing data on disk, allowing for resumption in case of a stop or crash. Additionally, this approach enables better memory handling since not all branches need to be in memory.
  * Domains have been added.
  * Hidden/body definitions and queries have been added.
  * A not-unify operator has been implemented.
  * Negation-by-failure has been put on hold. While it is a more complicated solution than not-unify, not-unify can solve some of the problems that negation-by-failure solves, but not all. Further research is needed.