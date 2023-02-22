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
/*
    / _ query:query _ {return [query]}
*/

definition = _ tuple:tuple _ body:body? _ {return {...tuple, body: body || []}}

body = "{" tuples:( _ tuple:tuple {return tuple} )* _ "}" 
	{
    	return tuples;
    }

/*
query = "?" tuple:tuple _
	{
    	return {type: 'query', data: tuple}
  }
*/

tuple = "(" _ terms:terms _ ")"
	{
		var t = {
        	type: 'tuple',
            data: terms
		};

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

term = except:"~"? term:(tuple / variable / constant) 
	{
		if (except) {
          return {type: 'except', data: term};
        }
        else {
        	return term
        }
	}

variable = "'" 
      varname:[_a-zA-Z0-9{}]*
      domain:(":"? "[" _  constants:constants _ "]"       {
      		return constants;
      	}
	  )? 
      {
        if (varname.length > 0) {
            return {type: 'variable', data: varname.join(""), domain};
        }

        return {type: 'variable', domain};
      }

constants = constant:constant wsp constants:constants 
    {
    	return [constant].concat(constants);
    }
	/ constant 

constant = !"/*" constant:[^\] \n\t\(\)'\^]+
	{
    	return {type: 'constant', data: constant.join("")};
  	}

comment = "/*" (!"*/" .)* "*/" / "#" [^\n\r]* [\n\r]

wsp = ([ \t\n\r] / comment)+ {return null}

_ "whitespace"
  = ([ \t\n\r] / comment)* {return null}

