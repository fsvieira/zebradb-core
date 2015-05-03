start
  = tuples:tuple* {return tuples;}



variable
  = "'" varname:([a-zA-Z][a-zA-Z0-9]*) 
 iter:("_" [0-9]+)?
 {
    iter = +(iter?iter[1].join(""):0);
    return {type: "variable", name: varname.join(""), iter:iter};
 }

constant
  = c:[^ \t\n()]+ 
    {return {type: "constant", value: c.join("")};}

tuple
  = wsp* "(" values:values ")" wsp*
     {return {type: "tuple", tuple: values};}

wsp
  = [ \t\n];

value
  = "^" v:value_expr {return {type: "variable", notEqual: v}}
  / value_expr 

value_expr
  = variable
  / constant
  / tuple

wsp_value
  = wsp+ v:value {return v;}

values 
  = wsp* value:value values:wsp_value* 
  {return [value].concat(values);}
