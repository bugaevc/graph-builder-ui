/*
 * LaTeX math subset parsing grammar
 * To build the parser itself use http://pegjs.majda.cz/
 */

start
  = expr

expr = del res:add { return res; }

add
  = left:mul "+" del right:add del { return left + '+' + right; }
  / left:mul "-" del right:add del { return left + '-' + right; }
  / "-" del right:add del { return '-' + right; }
  / mul

mul
  = left:pow "*"? del right:mul del { return left + '*' + right; }
  / left:pow "/" del right:mul del { return left + '/' + right; }
  / pow

pow
  = left:primary "^" del right:primary del { return left + '^' + right; }
  / primary

primary
  = int
  / "\\left"? "(" del additive:add "\\right"? ")" del { return '(' + additive + ')'; }
  / "\\left"? "|" del additive:add "\\right"? "|" del { return 'abs(' + additive + ')'; }
  / "{" del additive:add "}" del { return '(' + additive + ')'; }
  / command
  / letter:[a-z] del { return letter; }

command
  = "\\sqrt" del pr:primary { return "sqrt(" + pr + ")"; }
  / "\\sqrt" del "[" del pw:add "]" del pr:primary { return pr + "^ (1/(" + pw + "))"; }
  
  /"\\frac" del num:primary den:primary { return num + "/" + den; }
  
  / "\\sin" del pr:primary { return "sin(" + pr + ")"; }
  / "\\cos" del pr:primary { return "cos(" + pr + ")"; }
  / "\\tan" del pr:primary { return "tan(" + pr + ")"; }
  / "\\cot" del pr:primary { return "ctg(" + pr + ")"; }
  
  / "\\a" "rc"? "sin" del pr:primary { return "arcsin(" + pr + ")"; }
  / "\\a" "rc"? "cos" del pr:primary { return "arccos(" + pr + ")"; }
  / "\\a" "rc"? "tan" del pr:primary { return "arctan(" + pr + ")"; }
  / "\\a" "rc"? "cot" del pr:primary { return "arcctg(" + pr + ")"; }
  
  / "\\ln" del pr:primary { return "ln(" + pr + ")"; }
  / "\\log" del pr:primary { return "ln(" + pr + ")"; }
  / "\\log" del "_" del base:primary del pr:primary { return "log(" + pr + ", " + base + ")"; }
  
  / "\\lfloor" del pr:add "\\rfloor" del { return "floor(" + pr + ")"; }
  / "\\lceil" del pr:add "\\rceil" del { return "ceil(" + pr + ")"; }
  
  / "\\pi" del { return "pi"; }
  / "\\" "var"? "phi" del { return "phi"; }

int
  = digits:[0-9]+ del { return digits.join(""); }

del
  = [ ]*
  / "\\:"
