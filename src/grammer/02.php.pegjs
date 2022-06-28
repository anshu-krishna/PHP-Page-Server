Exp = (Txt / File / Val)*

File
	= "[[" f:$([^\x5D] / "]" !"]")* "]]" { return [ 'ty' => 'file', 'esc' => false, 'val' => trim($f) ]; }
    / "[<" f:$([^>] / ">" !"]")* ">]" { return [ 'ty' => 'file', 'esc' => true, 'val' => trim($f) ]; }

Val
	= "{{" _ i:Iden _ "}}" { return [ 'ty' => 'val', 'esc' => false, 'val' => $i ]; }
    / "{<" _ i:Iden _ ">}" { return [ 'ty' => 'val', 'esc' => true, 'val' => $i ]; }

Txt = c:TxtChar+ { return [ 'ty' => 'txt', 'val' => implode('', $c) ]; }
TxtChar
	= [^\x5B\x7B\x5C]
    / "\\[[" { return "[["; }
    / "\\{{" { return "\x7B\x7B"; }
    / "\\[<" { return "[<"; }
    / "\\{<" { return "\x7B<"; }
    / "[" !("[" / "<")
    / "{" !("{" / "<")

Iden = $([_a-z$]i [0-9a-z$_]i*)

// ----- Other -----
_ "whitespace" = [ \t\n\r]*