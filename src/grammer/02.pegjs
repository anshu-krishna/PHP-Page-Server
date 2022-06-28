Exp = (Txt / File / Val)*

File
	= "[[" f:$([^\x5D] / "]" !"]")* "]]" { return { ty: 'file', esc: false, val: f.trim() }; }
    / "[<" f:$([^>] / ">" !"]")* ">]" { return { ty: 'file', esc: true, val: f.trim() }; }

Val
	= "{{" _ i:Iden _ "}}" { return { ty: 'val', esc: false, val: i }; }
    / "{<" _ i:Iden _ ">}" { return { ty: 'val', esc: true, val: i }; }

Txt = c:TxtChar+ { return { ty:'txt', val: c.join('') }; }
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