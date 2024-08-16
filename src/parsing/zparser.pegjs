{
  /* 
    peggy --cache zparser.pegjs
  */
  const {
      type: {
          CONSTANT,
          TUPLE,
          CONSTRAINT,
          SET,
          SET_EXP,
          LOCAL_VAR,
          GLOBAL_VAR,
          INDEX,
          SET_SIZE,
          PROPOSITION
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
          UNIQUE,
          SUBSET
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
      case 'subset': return SUBSET;
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
/ proof

proof = _ "Proposition" wsp variable:variable wsp 
	property:constant _ ":" _ statement:constant 
    _ proof:expression _ {
    	return {
        	type: PROPOSITION,
            variable,
            property: property.data,
            statement: statement.data,
            proof
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
	!("«" / "/*" / [0-9] / "...") constant:[^ {}\n\t\(\)'|]+ {
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

element = tuple / variable / set
elements = (element:element _ {return element})* 

index_ops = 'is' wsp 'unique' {return UNIQUE}

index_vars = 
	variable:variable {return [variable]}
    / '[' _
    	 variables:(variable:variable (_ ',')? _ {return variable})+  
     ']' {return variables}
     
index = _ variables:index_vars wsp op:index_ops {return {
	type: INDEX,
    op,
    variables
}}

indexes = _ index:index indexes:( _ ',' _ idx:index {return idx})* {
	return [index].concat(indexes || [])
}

alias = 'as' wsp variable:variable _ ','? _ {return variable}

set_def = "{" _ element:element _ 
  expression:( "|" _ expression:expression {return expression;} 
  / "..." {return null}) _ "}" domain:(":" variable:variable {return variable})? _ alias:alias? _ indexes:indexes? _
     {
       return {
         type: SET,
         elements: [element],
         indexes,
         domain,
         expression,
         size: -1,
         elementAlias: alias
       }
     }
     / "{" _ elements:tupleTerms _ "..." _ "}" domain:(":" variable:variable {return variable})?
     {
       return {
         type: SET,
         elements,
         domain,
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

setSize = '|'_ variable:variable _ '|' {return {type: SET_SIZE, variable}} 
expression = logical_or

logical_or
  = a:logical_and _ op:('or' / ';') _ b:logical_or { return { type: CONSTRAINT, op: opCode(op), a, b }; }
  / logical_and

logical_and
  = a:equality _ op:('and' / ',') _ b:logical_and { return { type: CONSTRAINT, op: opCode(op), a, b }; }
  / equality

equality
  = a:relational _ op:('=' / '!=') _ b:equality { return { type: CONSTRAINT, op: opCode(op), a, b }; }
  / relational

relational
  = a:additive _ op:('>=' / '<=' / '<' / '>' ) _ b:relational { return { type: CONSTRAINT, op: opCode(op), a, b }; }
  / additive
  
additive
  = a:multiplicative _ op:('+' / '-') _ b:additive { return { type: CONSTRAINT, op: opCode(op), a, b }; }
  / multiplicative

multiplicative
  = a:expressionTerm _ op:('*' / '/' / '%') _ b:multiplicative { return { type: CONSTRAINT, op: opCode(op), a, b }; }
  / setExpression

setExpression 
  = a:(expressionTerm / tuple) wsp op:('in' / 'subset') wsp b:(set / variable) {return {type: CONSTRAINT, op: opCode(op), a, b }; }
  / expressionTerm

expressionTerm
  = variable 
  / constantExpression
  / setSize 
  / set
  / '[' _ expression:expression _ ']' {return expression}

/* 
  Comments and Helpers,
*/

comment = "/*" (!"*/" .)* "*/" / "#" [^\n\r]* [\n\r]

wsp = ([ \t\n\r] / comment)+ {return null}

_ "whitespace"
  = ([ \t\n\r] / comment)* {return null}
