Exp = (TxtExp / FileExp / ValExp )*

/* Format:
	Text: [ty = 0, value];
	Val: [ty = 1, mode = ( 0 = Normal / 1 = Esc / 2 = Debug ), value];
	File: [ty = 2, mode = ( 0 = Normal / 1 = Esc / 2 = No Parse ) , value];
*/

FileExp
	= "[[" _ f:String _ "]]" { return [ 2, 0, $f ]; }
	/ "[<" _ f:String _ ">]" { return [ 2, 1, $f ]; }
    / "[-" _ f:String _ "-]" { return [ 2, 2, $f ]; }

ValExp
	= "{{" _ v:Val _ "}}" { return [ 1, 0, $v ]; }
	/ "{<" _ v:Val _ ">}" { return [ 1, 1, $v ]; }
	/ "{?" _ v:Val _ "?}" { return [ 1, 2, $v ]; }

TxtExp "Text" = c:TxtChar+ { return [ 0, implode('', $c) ]; }
TxtChar
	= [^\x5C\x5B\x7B] // Everything except '\', "[" and '{'
	/ "\\" r:("\x5C" / "[" / "{") { return $r; }
	/ r:"[" ! ("[" / "<" / "-") { return $r; } // '[' Neg-Look-Ahead for '[', '<' or '-'
	/ r:"{" ! ("{" / "<" / "?") { return $r; } // '{' Neg-Look-Ahead for '{', '<' or '?'
	

Val = h:Iden t:ArrayKey* { return [$h, ...$t]; }
ArrayKey = "[" _ k:(Int / String) _ "]" { return $k; }
// ----- Other -----
String "string"
	= '"' chars:(
		[^\0-\x1F\x5C\x22] // Printable except '\' and '"'
		/ __SpecialChar
	)* '"' { return implode('', $chars); }
	/ "'" chars:(
		[^\0-\x1F\x5C\x27] // Printable except '\' and "'"
		/ __SpecialChar
	)* "'" { return implode('', $chars); }
	/ '`' chars:(
		[^\0-\x1F\x5C\x60] // Printable except '\' and '`'
		/ __SpecialChar
	)* '`' { return implode('', $chars); }
__SpecialChar
	= "\\" r:[\x5C\x22\x27\x60] { return $r; }
	/ "\\" r:[bfnrt] {
		return match($r) {
			'b' => "\b",
			'f' => "\f",
			'n' => "\n",
			'r' => "\r",
			't' => "\t",
		};
	}
	/ "\\0" digits:$([0-7][0-7]?[0-7]?) { return Helper::makeChar($digits, 8); }
	/ "\\x" digits:$(HexDigit HexDigit?) { return Helper::makeChar($digits, 16); }
	/ "\\u" digits:$(HexDigit HexDigit HexDigit HexDigit) { return Helper::makeChar($digits, 16); }
	/ [\x0A] // Allowed line-feed in string literal
	/ [\x09] // Allowed tab in string literal

Int = i:$("-"?[0-9]+) { return intval($i); }
Iden "Key"= $([_a-z$]i [0-9a-z$_]i*)
HexDigit "hex-char" = [0-9a-f]i
_ "Whitespace" = [ \t\n\r]*