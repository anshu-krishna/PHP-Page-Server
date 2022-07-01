{
	function makeChar(digits, base) {
		return String.fromCharCode(parseInt(digits, base));
	}
}

Exp = (TxtExp / FileExp / ValExp )*

FileExp
	= "[[" _ f:String _ "]]" { return { ty: 'file', esc: false, val: f }; }
	/ "[<" _ f:String _ ">]" { return { ty: 'file', esc: true, val: f }; }
    / "[-" _ f:String _ "-]" { return { ty: 'file-noparse', esc: true, val: f }; }

ValExp
	= "{{" _ i:Val _ "}}" { return { ty: 'val', esc: false, val: i }; }
	/ "{<" _ i:Val _ ">}" { return { ty: 'val', esc: true, val: i }; }
	/ "{?" _ i:Val _ "?}" { return { ty: 'val-debug', val: i }; }

TxtExp "Text" = c:TxtChar+ { return { ty:'txt', val: c.join('') }; }
TxtChar
	= [^\x5C\x5B\x7B] // Everything except '\', "[" and '{'
	/ "\\" r:("\x5C" / "[" / "{") { return r; }
	/ r:"[" ! ("[" / "<" / "-") { return r; } // '[' Neg-Look-Ahead for '[', '<' or '-'
	/ r:"{" ! ("{" / "<" / "?") { return r; } // '{' Neg-Look-Ahead for '{', '<' or '?'
	

Val = h:Iden t:ArrayKey* { return [h, ...t]; }
ArrayKey = "[" _ k:(Int / String) _ "]" { return k; }
// ----- Other -----
String "string"
	= '"' chars:(
		[^\0-\x1F\x5C\x22] // Printable except '\' and '"'
		/ __SpecialChar
	)* '"' { return chars.join(""); }
	/ "'" chars:(
		[^\0-\x1F\x5C\x27] // Printable except '\' and "'"
		/ __SpecialChar
	)* "'" { return chars.join(""); }
	/ '`' chars:(
		[^\0-\x1F\x5C\x60] // Printable except '\' and '`'
		/ __SpecialChar
	)* '`' { return chars.join(""); }
__SpecialChar
	= "\\" r:[\x5C\x22\x27\x60] { return r; }
	/ "\\" r:[bfnrt] {
		switch(r) {
			case 'b': return "\b";
			case 'f': return "\f";
			case 'n': return "\n";
			case 'r': return "\r";
			case 't': return "\t";
		}
	}
	/ "\\0" digits:$([0-7][0-7]?[0-7]?) { return makeChar(digits, 8); }
	/ "\\x" digits:$(HexDigit HexDigit?) { return makeChar(digits, 16); }
	/ "\\u" digits:$(HexDigit HexDigit HexDigit HexDigit) { return makeChar(digits, 16); }
	/ [\x0A] // Allowed line-feed in string literal
	/ [\x09] // Allowed tab in string literal

Int = i:$("-"?[0-9]+) { return parseInt(i); }
Iden "Key"= $([_a-z$]i [0-9a-z$_]i*)
HexDigit "hex-char" = [0-9a-f]i
_ "Whitespace" = [ \t\n\r]*