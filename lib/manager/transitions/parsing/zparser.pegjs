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
    / _ query:query _ {return [query]}

definition = _ tuple:tuple _ {return tuple;}

query = "?" tuple:tuple _
	{
    	return {type: 'query', data: tuple}
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

