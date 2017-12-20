{
  function flatten(arr) {
    return arr.reduce(function (flat, toFlatten) {
      return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
    }, []);
  }
}

z = definition:definition z:z 
    {
    	return [definition].concat(z);
    }
    / definition:definition 
    {
    	return [definition];
    }

definition = _ query:query _ {return query} / _ tuple:tuple _ {return tuple;}
/ _ file:include _ {return file} / _ funcDeclaration:funcDeclaration _ {
	return funcDeclaration;
}

include = "[" file:[^\]]+ "]" {return {type: "include", data: file.join('')}}

query =    "?" tuple:tuple _ func:funcCall? 
	{
    	return {type: 'query', data: tuple, func: func}
  }

tuple = "(" _ terms:terms _ ")" 
	{
		var t = {
        	type: 'tuple', 
            data: terms.filter(function (v) {
            	return v.type !== 'not';
           	}),
            negation: terms.filter(function (v) {
                return v.type === 'not';
            }).map(function (v) {
              return v.data;
            })
		};

		if (t.negation.length === 0) {
		  delete t.negation;
		}
		
		return t;
	} / "()" {return {type: "tuple", data: []}}

terms = term:term wsp terms:terms 
	{
    	return [term].concat(terms);
	}
	/ term:term
    {
    	return [term]
    }

term = tuple / variable / constant / not

not = "^" tuple:tuple 
	{
      return {
          type: 'not',
          data: tuple
      }
	}

variable = variable:variableID "::" tuple:tuple {
	return {type: 'tuple', data: tuple, variable: variable}
} / variableID 

variableID = "'" varname:[_a-zA-Z0-9{}]* 
	{
      if (varname.length > 0) {
          return {type: 'variable', data: varname.join("")};
      }

      return {type: 'variable'};
	}

constant = !"/*" constant:[^ \n\t\(\)'\^]+ 
	{
    	return {type: 'constant', data: constant.join("")};
  	}

comment = "/*" (!"*/" .)* "*/" / "#" [^\n\r]* [\n\r]

wsp = ([ \t\n\r] / comment)+ {return null}

_ "whitespace"
  = ([ \t\n\r] / comment)* {return null}


/*tansformation language */
funcCall = _ "|" _ funcname:funcname
	{ return funcname}

funcname = funcname:[_a-zA-Z0-9]+ 
	{ return funcname.join("");}

funcDeclaration = funcname:funcname _ ":" _ funcBody:funcBody _ "." {
	return {
    	type: 'function',
        data: funcBody,
        name: funcname
    }
}

funcBody = lines:(funcBodyLine "," _)* line:finalCode {
	lines = lines?flatten(lines).filter(function (v) { return v !== null && v !== ","; }):[];
	return {
    	type: 'code',
        data: lines.concat([line])
    };
}

funcBodyLine = match:matchValues _ "->" _ code:code {
	return {
    	type: 'statment',
        data: {
        	match: match,
            code: code
        }
    }
}

finalCode = funcBodyLine
/ "'" _ "->" _ code:code {
	return {
    	type: 'defaultStatemnt',
        data: code
    }
}

matchValues = tuple:tuple {return tuple;} / constant:constant {return constant};

code = jsonValue / json

funcBodyCall = variable:variable funcCall:funcCall {
	return {
    	type: 'call',
        data: {
          funcname: funcCall,
          variable: variable
      	}
  	};
} / variable:variable {
	return variable;
}

number = 
	number:[0-9]+ "." decimal:[0-9]+ {
		return {
			type: 'number', 
    		data: +(number.join("") + "." + decimal.join(""))
		}
    } / 
	number:[0-9]+ {
    	return {
        	type: 'number', 
        	data: +number.join("")
		};
    }
	

json = jsonObject / jsonArray
jsonLabel = [a-zA-Z0-9_]+

jsonObject = "{" jsonBody? "}"
jsonArray = "[" jsonValues? "]"

jsonBody = (jsonPair _ "," _)* jsonPair
jsonPair = jsonLabel _ ":" _ jsonValue

jsonValue = number / funcBodyCall / concatString / json
jsonValues = (jsonValue _ "," _)* jsonValue

concatString = lines:(string _ jsonValue? _)+
{
	var values = flatten(lines).filter(function (v) { return v !== null; });
    var i, v, vv;
    for (i=values.length-1; i>=0; i--) {
    	v = values[i];

		if (i > 0 && v.type === 'string') {
        	vv = values[i-1];
            
            if (vv.type === 'string') {
              vv.data += v.data;
              values.splice(i, 1);
            }
        }
    }
    
    return values;
}


string = "\"" string:[^"]* "\"" {
	return {type:'string', data: string.join("")};
}

