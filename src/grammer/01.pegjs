File = a:All* { return a.flat(1); }
All = Txt / AnyExp

Txt = c:TxtChar+ { return [{ ty:'txt', val: c.join('') }]; }
TxtChar
	= "[@]" { return "@" }
    / "[{{]" { return "\x7B\x7B" }
    / [^@<\x7B]
    / "<" !("@" / "$")

AnyExp = PathExp / i:IdenExp { return [i]; }
PathExp
	= "<@" p:Paths "@>" {
		for(let i=0, j=p.length; i<j; i++){ p[i].en = true; }
		return p;
	}
    / "@" p:Paths "@" { return p; }
Paths = _ head:Path tail:(PIPE p:Path { return p; })* PIPE? { return [head, ...tail]; }
Path = p:$[^@|]+ {
		return {
			en:false,
			ty: 'path',
			val: p.trim()
		};
	}
IdenExp
	= "<{{" _ i:Iden _ "}}>" { i.en = true; return i; }
    / "{{" _ i:Iden _ "}}" { return i; }
Iden = i:$([_a-z$]i [0-9a-z$_]i*) {
		return {
			//at: location()['start']['line'],
			en:false,
			ty: 'val',
			val: i
		};
	}
// ----- Other -----
_ "whitespace" = [ \t\n\r]*

// ----- Symbols -----
PIPE = _ "|" _

/*

@ file1.php | file2.html | file3.txt @
<@ file1.php | file2.html | file3.txt  @>

{{ abc }}
<{{ abc }}>

dsdsa   [[file1.php]] adads {{ abc_sd }}

*/