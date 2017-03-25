z = definition:definition z:z 
    {
    	return [definition].concat(z);
    }
    / definition:definition 
    {
    	return [definition];
    }

definition = _ query:query _ {return query} / _ tuple:tuple _ {return tuple;}

query = "?" tuple:tuple 
	{
    	return {type: 'query', data: tuple }
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

		if (t.data.length === 0) {
		  throw "Tuple can't be empty";
		}
		
		if (t.negation.length === 0) {
		  delete t.negation;
		}
		
		return t;
	}

terms = term:term wsp terms:terms 
	{
    	return [term].concat(terms);
	}
	/ term:term
    {
    	return [term]
    }

term = tuple / varname / constant / not

not = "^" tuple:tuple 
  {
      return {
          type: 'not',
          data: tuple
      }
  }

varname = "'" + varname:[_\-a-zA-Z0-9]* 
  {
      if (varname.length > 0) {
          return {type: 'variable', data: varname.join("")};
      }

      return {type: 'variable'};
  }

constant = constant:[^ \n\t\(\)'\^]+ 
	{
    	return {type: 'constant', data: constant.join("")};
    }

wsp = [ \t\n\r]+

_ "whitespace"
  = [ \t\n\r]*
