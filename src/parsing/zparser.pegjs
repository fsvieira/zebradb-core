{
  const {
      type: {
          CONSTANT,
          TUPLE,
          CONSTRAINT,
          SET,
          SET_CS,
          SET_EXP,
          LOCAL_VAR,
          GLOBAL_VAR,
          INDEX
      },
      operation: {
          OR,
          AND,
          IN,
          UNIFY,
          NOT_UNIFY,
          UNION,
          ADD,
          SUB,
          MUL,
          DIV,
          MOD,
          FUNCTION,
          BELOW,
      	  BELOW_OR_EQUAL,
          ABOVE,
          ABOVE_OR_EQUAL,
          UNIQUE
      }
  } = require("../branch/operations/constants");

  const opCode = op => {
    switch (op) {
      case '=': return UNIFY;
      case '!=': return NOT_UNIFY;
      case 'in': return IN;
      case 'and': return AND;
      case ',': return AND;
      case 'or': return OR;
      case ';': return OR;
      case 'union': return UNION;
      case '+': return ADD;
      case '-': return SUB;
      case '*': return MUL;
      case '/': return DIV;
      case '%': return MOD;
      case '<': return BELOW;
      case '<=': return BELOW_OR_EQUAL;
      case '>': return ABOVE;
      case '>=': return ABOVE_OR_EQUAL;
    }
  }
}

start = definitions

definitions = definitions:(definition:definition _ {return definition})* {return definitions}

definition = _ variable:(globalVariable:globalVariable _ "=" {return globalVariable})? _ set:set {
  return {
  	...set,
  	variable
  }
}

/* Terms */

// tuple
tuple = "(" _ terms:tupleTerms _ ")" domain:(':' domain:variable {return domain})? { return { type: TUPLE, data: terms, domain } }
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
	!("«" / "/*" / [0-9]) constant:[^ {}\n\t\(\)'|]+ {
    	return {
        	type: CONSTANT,
            data: constant.join("")
        }
    }

number = sign:'-'? int:[0-9]+ float:('.' float:[0-9]+ {return '.' + float.join('')})? {
  const n = (sign || '') + int.join('') + (float || '');
  return {type: CONSTANT, data: n }
}

constantExpression = "«" constant:[^»]+ "»" {
   return {
      type: CONSTANT,
      data: constant.join("")
   }
} / number

/* 
  sets 
*/

element = tuple / variable
elements = (element:element _ {return element})* 

index_ops = 'unique'

index = op:index_ops _ variable:variable {return {
	type: INDEX,
    op,
    variable
}}

indexes = _ index:index indexes:( _ ',' _ idx:index {return idx})* {
	return [index].concat(indexes || [])
}

set_def = "{" _ element:element _ indexes:indexes? _ "|" _ expression:(expression:expression _ {
return expression;
})? "}"
     {
       return {
         type: SET_CS,
         element,
         expression,
         indexes,
         size: -1
       }
     }
     / "{" _ elements:tupleTerms _ "}"
     {
       return {
         type: SET,
         elements,
         expression: null,
         size: elements.length
       }
     }
     / tuple 
     / variable
     / '[' _ set:set _ ']' {return set}

set_op = 'union'

set = a:set_def _ op:set_op _ b:set {
  	return {
       type: SET_EXP,
       a,
       op: opCode(op),
       b
    }
  }
  / set:set_def {return set} 


expression = logical_or

logical_or
  = a:logical_and _ op:('or' / ';') _ b:logical_or { return { type: CONSTRAINT, op: opCode(op), a, b }; }
  / logical_and

logical_and
  = a:equality _ op:('and' / ',') _ b:logical_and { return { type: CONSTRAINT, op: opCode(op), a, b }; }
  / equality

equality
  = a:additive _ op:('=' / '!=') _ b:equality { return { type: CONSTRAINT, op: opCode(op), a, b }; }
  / relational

relational
  = a:additive _ op:('>=' / '<=' / '<' / '>' ) _ b:relational { return { type: CONSTRAINT, op: opCode(op), a, b }; }
  / additive
  
additive
  = a:multiplicative _ op:('+' / '-') _ b:additive { return { type: CONSTRAINT, op: opCode(op), a, b }; }
  / multiplicative

multiplicative
  = a:expressionTerm _ op:('*' / '/' / '%') _ b:multiplicative { return { type: CONSTRAINT, op: opCode(op), a, b }; }
  / expressionTerm

expressionTerm
  = set 
  / variable 
  / constantExpression
  / [a-zA-Z]+ args
  / '[' _ expression:expression _ ']' {return expression}

func = f:('floor' / 'round' / 'ceil') '[' args:args ']' {return {type: FUNCTION, name: f, args }}
args = a:expression _ rest:(';' _ r:expression _ {return r;})* {return [a].concat(rest)}  

/* 
  Comments and Helpers,
*/

comment = "/*" (!"*/" .)* "*/" / "#" [^\n\r]* [\n\r]

wsp = ([ \t\n\r] / comment)+ {return null}

_ "whitespace"
  = ([ \t\n\r] / comment)* {return null}
