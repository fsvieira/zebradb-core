{
  const {
      type: {
          CONSTANT,
          TUPLE,
          VARIABLE,
          CONSTRAINT,
          SET
      },
      operation: {
          OR,
          AND,
          IN,
          UNIFY
      }
  } = require("../branch/operations/constants");

  const opCode = op => {
    switch (op) {
      case '=': return UNIFY;
      case 'in': return IN;
      case 'and': return AND;
      case 'or': return OR;
    }
  }
}

start = definitions

definitions = definitions:(definition:definition _ {return definition})* {return definitions}

definition = variable:(globalVariable:globalVariable _ "=" {return globalVariable})? _ set:set {
  return {
  	...set,
  	variable
  }
}

/* Terms */

// tuple
tuple = "(" _ terms:tupleTerms _ ")" { return { type: TUPLE, data: terms } }
       / "()" { return { type: TUPLE, data: [] } }

tupleTerm = tuple / variable / constant
tupleTerms = tupleTerm:tupleTerm terms:(wsp terms:tupleTerm {return terms})* { return [tupleTerm].concat(terms) }

// variables,
variable = globalVariable / localVariable
globalVariable = "$" varname:[_a-zA-Z0-9]+ {return { type: GLOBAL_VAR, varname: varname.join("") } }
localVariable = "'" varname:[_a-zA-Z0-9]* domain:(":" variable:variable {return variable})?
  {
  	return { 
    	type: LOCAL_VAR, 
		varname: varname.length ? varname.join(""):undefined,
        domain
    } 
  }

// constants,
constant = constantExpression / 
	!("«" / "/*") constant:[^ {}\n\t\(\)'|]+ {
    	return {
        	type: CONSTANT,
            data: constant.join("")
        }
    }

constantExpression = "«" constant:[^»]+ "»" {
   return {
      type: CONSTANT,
      data: constant.join("")
   }
}

/* 
  sets 
*/

element = tuple / variable
elements = (element:element _ {return element})* 
set = "{" _ elements:elements "|" _ expression:expression _ "}"
     {
       return {
         type: SET,
         elements,
         expression
       }
     }
     / "{" _ elements:tupleTerms _ "}"
     {
       return {
         type: SET,
         elements,
         expression: null
       }
     }
     / tuple 

/*
Expression
*/
operations = op:('!=' / '=' / 'in' / 'and' / 'or') {return opCode(op)}

expressionTerm = set / variable / constantExpression
expressionTerms = expressionTerm:expressionTerm terms:(wsp terms:expressionTerm {return terms})* 
  { return [expressionTerm].concat(terms) }

expression = a:expressionTerm _ op:operations _ b:expression {
   return {type: CONSTRAINT, a, op, b};
} 
/ '[' _ expression:expression _ ']' {return expression}
/ expressionTerm


/* 
  Comments and Helpers,
*/

comment = "/*" (!"*/" .)* "*/" / "#" [^\n\r]* [\n\r]

wsp = ([ \t\n\r] / comment)+ {return null}

_ "whitespace"
  = ([ \t\n\r] / comment)* {return null}

