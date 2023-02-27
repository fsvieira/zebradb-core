z = definition:definition z:z
    {
    	return [definition].concat(z);
    }
    / definition:definition
    {
    	return [definition];
    }

definition = _ tuple:tuple _ body:body? _ {return {...tuple, body: body || []}}

body = "{" tuples:( _ tuple:tuple {return tuple} )* _ "}" 
	{
    	return tuples;
    }

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

term = term:(tuple / variable / constant) 
	{
       	return term
	}

except = "~" except:(
      	 term:term {return [term];}
        / "{" _ terms:terms _ "}" {return terms}
      ) {return except}
      
variable = variable:(
		"'" 
        varname:[_a-zA-Z0-9]*
        domain:(":"? "{" _  constants:constants _ "}" {
              return constants;
          }
        )? 
        except:except?
        {
          return {
              type: 'variable',
              data: varname.length > 0 ? varname.join("") : undefined,
              domain,
              except
          }
        }
      ) 
      / except:except
      {
        return {
        	type: 'variable',
            except
        };
      } 
      

constants = constant:constant wsp constants:constants 
    {
    	return [constant].concat(constants);
    }
	/ constant 

constant = !"/*" constant:[^\{\} \n\t\(\)'\^]+
	{
    	return {type: 'constant', data: constant.join("")};
  	}

comment = "/*" (!"*/" .)* "*/" / "#" [^\n\r]* [\n\r]

wsp = ([ \t\n\r] / comment)+ {return null}

_ "whitespace"
  = ([ \t\n\r] / comment)* {return null}

