{{
  /* 
    peggy --cache zparser.pegjs
    peggy --cache --format es -o zparser.mjs zparser.peggy
  */

  import { type, operation } from "../branch/operations/constants.mjs";
 
  const opCode = op => {
    switch (op) {
      case '=': return operation.UNIFY;
      case '!=': return operation.NOT_UNIFY;
      case 'in': return operation.IN;
      case 'and': 
      case ',': return operation.AND;
      case 'or': 
      case ';': return operation.OR;
      case 'union': return operation.UNION;
      case 'subset': return operation.SUBSET;
      case '+': return operation.ADD;
      case '-': return operation.SUB;
      case '*': return operation.MUL;
      case '/': return operation.DIV;
      case '%': return operation.MOD;
      case '<': return operation.BELOW;
      case '<=': return operation.BELOW_OR_EQUAL;
      case '>': return operation.ABOVE;
      case '>=': return operation.ABOVE_OR_EQUAL;
    }
  }
}}

start = imports:imports definitions:definitions {return imports.concat(definitions)}

imports = (_ imp:import _ {return imp})*
import = 
	'assume' wsp packageID:packageID {
    	return {type: type.ASSUME, packageID}
    }
	/ 'consider' wsp filepath:quotedString {
    	return {type: type.CONSIDER, filepath}
    }
	

packageID = packageName:packageName '@' semVersion:semVersion {
  return {packageName, semVersion}
}

packageName = username:[a-zA-Z0-9_]+ '.' packageName:[a-zA-Z0-9_]+ {
	return {username: username.join(''), packageName: packageName.join('')}
}

digit = [0-9]
semVersion
  = major:digit+ "." minor:digit+ "." patch:digit+ preRelease:preRelease? build:buildMeta? {
      return { major: major.join(''), minor: minor.join(''), patch: patch.join(''), preRelease, build };
    }

preRelease
  = "-" identifier:([a-zA-Z0-9.-]+) {
      return identifier.join('');
    }

buildMeta
  = "+" identifier:([a-zA-Z0-9.-]+) {
      return identifier.join('');
    }
quotedString = "\"" chars:([^"]*) "\"" {
      return chars.join('');
    }


definitions = definitions:(definition:definition _ {return definition})* {return definitions}

definition = _ variable:(globalVariable:globalVariable _ "=" {return globalVariable})? _ set:set {
  return {
  	...set,
  	variable
  }
}
/ proof
/ query

proof = _ "Proposition" wsp variable:variable wsp 
	property:constant _ ":" _ statement:constant 
    _ proof:expression _ {
    	return {
        	type: type.PROPOSITION,
          variable,
          property: property.data,
          statement: statement.data,
          proof
        }
    }


query = _ "Query" wsp statement:constant 
    _ query:set _ {
    	return {
          type: type.QUERY,
          statement: statement.data,
          query
        }
    }

/* Terms */

// tuple
tuple = "(" _ terms:tupleTerms _ ")" domain:(':' domain:variable {return domain})? { return { type: type.TUPLE, data: terms, domain } }
       / "()" { return { type: type.TUPLE, data: [] } }

tupleTerm = tuple / variable / constant
tupleTerms = tupleTerm:tupleTerm terms:(wsp terms:tupleTerm {return terms})* { return [tupleTerm].concat(terms) }

// variables,
variable = globalVariable / localVariable
globalVariable = "$" varname:[_a-zA-Z0-9]+ {return { type: type.GLOBAL_VAR, varname: varname.join("") } }
localVariable = "'" varname:[_a-zA-Z0-9]* domain:(":" variable:variable {return variable})?
  {
  	return { 
    	type: type.LOCAL_VAR, 
  		varname: varname.length ? varname.join(""):undefined,
      domain
    } 
  }

// constants,
constant = constantExpression / 
	!("«" / "/*" / [0-9] / "...") constant:[^ {}\n\t\(\)'|]+ {
    	return {
        	type: type.CONSTANT,
            data: constant.join("")
        }
    }

number = sign:'-'? int:[0-9]+ float:('.' float:[0-9]+ {return '.' + float.join('')})? {
  const n = (sign || '') + int.join('') + (float || '');
  return {type: type.CONSTANT, data: n }
}

constantExpression = "«" constant:[^»]+ "»" {
   return {
      type: type.CONSTANT,
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
	type: type.INDEX,
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
         type: type.SET,
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
         type: type.SET,
         elements,
         domain,
         size: -1
       }
     }
     / "{" _ elements:tupleTerms _ "}"
     {
       return {
         type: type.SET,
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
       type: type.SET_EXP,
       a,
       op: opCode(op),
       b
    }
  }
  / set:set_def {return set} 

setSize = '|'_ variable:variable _ '|' {return {type: type.SET_SIZE, variable}} 
expression = logical_or

logical_or
  = a:logical_and _ op:('or' / ';') _ b:logical_or { return { type: type.CONSTRAINT, op: opCode(op), a, b }; }
  / logical_and

logical_and
  = a:equality _ op:('and' / ',') _ b:logical_and { return { type: type.CONSTRAINT, op: opCode(op), a, b }; }
  / equality

equality
  = a:relational _ op:('=' / '!=') _ b:equality { return { type: type.CONSTRAINT, op: opCode(op), a, b }; }
  / relational

relational
  = a:additive _ op:('>=' / '<=' / '<' / '>' ) _ b:relational { return { type: type.CONSTRAINT, op: opCode(op), a, b }; }
  / additive
  
additive
  = a:multiplicative _ op:('+' / '-') _ b:additive { return { type: type.CONSTRAINT, op: opCode(op), a, b }; }
  / multiplicative

multiplicative
  = a:expressionTerm _ op:('*' / '/' / '%') _ b:multiplicative { return { type: type.CONSTRAINT, op: opCode(op), a, b }; }
  / setExpression

setExpression 
  = a:(expressionTerm / tuple) wsp op:('in' / 'subset') wsp b:(set / variable) {return {type: type.CONSTRAINT, op: opCode(op), a, b }; }
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
