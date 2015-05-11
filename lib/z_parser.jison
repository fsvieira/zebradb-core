/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex
%%

\s+                   /* skip whitespace */
"'"[a-zA-Z\-]+[a-zA-Z0-9\-]*("_"[0-9]+)?\b  return 'VARIABLE'
"'"                   return "ANONYMOUS_VARIABLE"
"^"                   return '^'
"_"                   return 'IGNORE'
"("                   return '('
")"                   return ')'
<<EOF>>               return 'EOF'
[^ \s()\^'_]+         return 'CONSTANT'
.                     return 'INVALID'

/lex

/* operator associations and precedence */



%start declarations

%% /* language grammar */

declarations
    : tuples EOF {return $1;}
    ;

tuples
    : tuple {$$=[$1];}
    | tuples tuple {$$=$1.concat($2);}
    ;

tuple
    : '(' values ')' {$$={type: "tuple", tuple: $2};}
    ;

values
    : value {$$=[$1];}
    | values value {$$=$1.concat($2);}
    ;

value
    : value_expr {$$=$1;}
    | '^' value_expr {$$={type: "variable", notEqual: $2};} 
    ;

value_expr
    : VARIABLE {$$={type: "variable", name: yytext.substring(1)};}
    | ANONYMOUS_VARIABLE {$$={type: "variable", name: ""};}
    | tuple {$$=$1;}
    | CONSTANT {$$={type: "constant", value: yytext};}
    | IGNORE {$$={type: "ignore"};}
    ;
