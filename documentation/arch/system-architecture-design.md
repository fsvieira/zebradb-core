Concepts
===

  1. **Definitions:**
     - Definitions represent defined sets that can be associated with variables in your system. These sets define the constraints and properties of the variables they are associated with.
  
  2. **Facts:**
     - Facts are a top-level type of definition, and they can be associated with global variables. Facts often represent fundamental truths or conditions that guide the behavior and constraints of the system.
  
  3. **Query:**
     - Queries are elements that trigger a search for facts in the system's definitions database. Queries are used to obtain information or derive conclusions based on the defined sets and facts in the system.
     - Queries can be a set or tuple.

  4. **User Query**
     - it's called in an explicit user query context.
     - A query always starts with a user query, and new sub-queries are created when facts are unified with nested definitions. Both top-level facts and nested definitions must be checked for truth.
    
       
