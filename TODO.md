# TODO:
    - Planner
        - select linked tuples, after selecting initial tuples include tuples with same variables included on initial tuples.
        - construct dependicy graphs for query:
            - rank: number of dependecys,
            - check for linked variables transformation to constants.
            - check for tree leaf.
            
        - construct tree with linked tuples, make virtual linked tuples with definitions, analise dependecys and leafs.

- Problems:
    - planner can't just choose tuples by looking at definitions,
    - there must be a choice of related tuples or father tuple validation may take to long before its validated.
    - also other child tuples may grow to infinity.



---
    Virtual Steps:
        - create definitions graph (with an id for every tuple),
        - associete a virtual field corresponding to the id tuple id on the graph,
        - everytime definitions are unified with tuples preserve or merge virtuals,
        - the virtual structure should give a better information of tuple expansion and a tool for planning.
        
