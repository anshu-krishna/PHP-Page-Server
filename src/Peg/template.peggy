/* Version 5
	Format {
		Text: [ty = 0, value];
		Val: [ty = 1, mode = ( 0 = Normal / 1 = Esc / 2 = Debug ), value];
		File: [ty = 2, mode = ( 0 = Normal / 1 = Esc / 2 = No Parse ) , value];
	}
*/
{
	const content = [];
	let html = '';
	function reset_html() {
		if(html.length > 0) {
			content.push([0, html]);
			html = '';
		}
	}
	function add_content(item) {
		reset_html();
		content.push(item);
	}
	/** <?php
	Helper::$view_content = [];
	Helper::$view_html = ''; ?>
	**/
}
Exp = a:( FileExp / ValExp / Text )* EOF {
		reset_html();
		return content;
		/** <?php
		Helper::view_reset_html();
		return Helper::$view_content;
		?> **/
	}

Text
	= i:"\\\\" &ExpStart { html += "\\"; /** <?php Helper::$view_html .= $i; ?> **/ }
	/ "\\" i:ExpStart { html += i; /** <?php Helper::$view_html .= $i; ?> **/ }
	/ i:. { html += i; /** <?php Helper::$view_html .= $i; ?> **/ }

EOF = !.

ExpStart = "[[" / "[<" / "[-" / "{{" / "{<" / "{?"

FileExp
	= "[[" _ f:String _ "]]" {
			add_content([ 2, 0, f ]);
			/** <?php Helper::view_add_content([ 2, 0, $f ]); ?> **/
		}
	/ "[<" _ f:String _ ">]" {
			add_content([ 2, 1, f ]);
			/** <?php Helper::view_add_content([ 2, 1, $f ]); ?> **/
		}
	/ "[-" _ f:String _ "-]" {
			add_content([ 2, 2, f ]);
			/** <?php Helper::view_add_content([ 2, 2, $f ]); ?> **/
		}

ValExp
	= "{{" _ v:Val _ "}}" {
			add_content([1, 0, v]);
			/** <?php Helper::view_add_content([ 1, 0, $v ]); ?> **/
		}
	/ "{<" _ v:Val _ ">}" {
			add_content([1, 1, v]);
			/** <?php Helper::view_add_content([ 1, 1, $v ]); ?> **/
		}
	/ "{?" _ v:Val _ "?}" {
			add_content([1, 2, v]);
			/** <?php Helper::view_add_content([ 1, 2, $v ]); ?> **/
		}

Val = h:Iden t:ArrayKey* {
		return [h, ...t];
		/** <?php return [$h, ...$t]; ?> **/
	}
ArrayKey = "[" _ k:(Int / String) _ "]" {
		return k;
		/** <?php return $k; ?> **/
	}
// ----- Other -----
String "string" = '`' chars:Char* '`' {
		return chars.join('');
		/** <?php return implode('', $chars); ?> **/
	}
Char
	= [^\0-\x1F\x5C\x60] // Printable except '\' and '`'
	/ "\\" r:[\x5C\x60] { return r; /** <?php return $r; ?> **/ }
	/ "\\" r:[bfnrt] {
		switch(r) {
			case 'b': return '\b';
			case 'f': return '\f';
			case 'n': return '\n';
			case 'r': return '\r';
			case 't': return '\t';
		}
		/** <?php return match($r) {
			'b' => "\b",
			'f' => "\f",
			'n' => "\n",
			'r' => "\r",
			't' => "\t",
		}; ?> **/
	}
	/ "\\0" digits:$([0-7][0-7]?[0-7]?) {
		return String.fromCharCode(parseInt(digits, 8));
		/** <?php return Helper::makeChar($digits, 8); ?> **/
	}
	/ "\\x" digits:$(HexDigit HexDigit?) {
		return String.fromCharCode(parseInt(digits, 16));
		/** <?php return Helper::makeChar($digits, 16); ?> **/
	}
	/ "\\u" digits:$(HexDigit HexDigit HexDigit HexDigit) {
		return String.fromCharCode(parseInt(digits, 16));
		/** <?php return Helper::makeChar($digits, 16); ?> **/
	}
	/ [\x0A] // Allowed line-feed in string literal
	/ [\x09] // Allowed tab in string literal

Int = i:$("-"?[0-9]+) { return parseInt(i); /** <?php return intval($i); ?> **/ }
Iden "Key"= $([_a-z$]i [0-9a-z$_]i*)
HexDigit "hex-char" = [0-9a-f]i
_ "Whitespace" = [ \t\n\r]*