/* Version 6
	Format {
		Text: [ty = 0, value];
		Val: [ty = 1, mode = ( 0 = Normal / 1 = Esc / 2 = Debug ), value];
		File: [ty = 2, mode = ( 0 = Normal / 1 = Esc / 2 = No Parse ) , value];
	}
*/


FileExp
	= "[[" _ f:String _ "]]"
	/ "[<" _ f:String _ ">]"
	/ "[-" _ f:String _ "-]"

ValExp
	= "{{" _ v:Val _ "}}"
	/ "{<" _ v:Val _ ">}"
	/ "{?" _ v:Val _ "?}"

Val = h:Iden t:ArrayKey* { return [h, ...t]; }
ArrayKey = "[" _ k:(Int / String) _ "]" { return k; }
// ----- Other -----
String "string" = '`' chars:Char* '`' { return chars.join(''); }
Char
	= [^\0-\x1F\x5C\x60] // Printable except '\' and '`'
	/ "\\" r:[\x5C\x60] { return r; }
	/ "\\" r:[bfnrt] {
		switch(r) {
			case 'b': return '\b';
			case 'f': return '\f';
			case 'n': return '\n';
			case 'r': return '\r';
			case 't': return '\t';
		}
	}
	/ "\\0" digits:$([0-7][0-7]?[0-7]?) {
		return String.fromCharCode(parseInt(digits, 8));
	}
	/ "\\x" digits:$(HexDigit HexDigit?) {
		return String.fromCharCode(parseInt(digits, 16));
	}
	/ "\\u" digits:$(HexDigit HexDigit HexDigit HexDigit) {
		return String.fromCharCode(parseInt(digits, 16));
	}
	/ [\x0A] // Allowed line-feed in string literal
	/ [\x09] // Allowed tab in string literal

Int = i:$("-"?[0-9]+) { return parseInt(i); }
Iden "Key"= $([_a-z$]i [0-9a-z$_]i*)
HexDigit "hex-char" = [0-9a-f]i
_ "Whitespace" = [ \t\n\r]*