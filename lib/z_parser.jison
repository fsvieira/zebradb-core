%{
var types = require("./types.js");
%}

/* lexical grammar */
%lex

%x path
%x line-comment
%x multi-comment
%s code

%%
\s+             /* skip white spaces */

"["               this.begin("path");
<path>[^\]\n]+   {return "PATH";}
<path>"]"         this.popState();

"//"           this.begin("line-comment");
<line-comment>[^\n] /* Ignore everything */
<line-comment>[\n] this.popState();

"/*"           this.begin("multi-comment");
<multi-comment>[^*] /* Ignore everything */
<multi-comment>"*"[^/] /* Ignore everything */
<multi-comment>"*/" this.popState();

"{"            {this.begin("code");return '{';}
<code>[^{}]+   return 'CODEBLOCK'
<code>"}"      {this.popState();return '}';}


"^"                   return '^'
"("                   return '('
")"                   return ')'
"?"                   return '?'
"'"[a-zA-Z\-]+[a-zA-Z0-9\-]*("_"[0-9]+)?\b  return 'VARIABLE'
"'"                   return "ANONYMOUS_VARIABLE"
"_"                   return 'IGNORE'
[^ \s()\^'_]+         return 'CONSTANT'
<<EOF>>     /* ignore */
.           return 'INVALID'

/lex

/* operator associations and precedence */

%start declarations

%% /* language grammar */

declarations
    : decls {return $1;}
    ;

decls
    : decl {$$=[$1];}
    | decls decl {$$=$1.concat($2);}
    ;

decl
    : tuple {$$=$1;}
    | "?" tuple {$$={type: "query", tuple: $2};}
    | "?" tuple code {$$={type: "query", tuple: $2, code: "(function (q) {" + $3 + "})"};}
    | PATH {$$={type: "import", path: yytext};}
    ;

code
   : code_st  {$$=$1;}
   | code code_st {$$=$1 + $2;}
   ;

code_st
    : '{'       {$$="{";} 
    | '}'       {$$="}";}
    | CODEBLOCK {$$=$1;}
    ;

tuple
    : '(' values ')' {$$=types.t($2);}
    ;

values
    : value {$$=[$1];}
    | values value {$$=$1.concat($2);}
    ;

value
    : value_expr {$$=$1;}
    | IGNORE {$$={type: "ignore"};}
    | '^' value_expr {$$=types.n($2);}
    ;

value_expr
    : VARIABLE {$$=types.v(yytext.substring(1));}
    | ANONYMOUS_VARIABLE {$$=types.v();}
    | CONSTANT {$$=types.c(yytext);}
    | tuple {$$=$1;}
    ;
