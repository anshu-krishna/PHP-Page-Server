/*********************** GRAMMER ***********************/
{
	function makeMatchResult(list) {
		const storeEntries = list.map((item, idx) => [item[0], idx ]).filter(item => item[0] !== null);
		const m = list.map(i => i[1]);
		return storeEntries.length ? { match: m, store: Object.fromEntries(storeEntries) } : { match: m };
	}
}

Exp = _ r:Route _ { return r; }
Route
	= "@" r:STR { return { import: r }; }
	/ v:(STR / NONE) n:(ARROW "{" _ @Next _ "}")? {
			const ret = {};
			ret.view = v;
			if(n !== null) { ret.nxt = n; }
			return ret;
		}

Next = h:NextItem t:( COMMA @NextItem )* COMMA? { return [h, ...t]; }
NextItem = m:Matches COLON r:Route { return { ...m, ...r }; }

Matches
	= m:Match { return makeMatchResult([m]); }
	/ "[" _ h:Match t:( COMMA @Match )* COMMA? _ "]" {
		return makeMatchResult([h, ...t]);
	}
Match = s:("$" @IDEN EQ)? MatchStr // [0] = store; [1] = Match options
MatchStr
	= h:STR t:( OR @STR )* { return [h, ...t]; }
	/ "(" _ h:STR t:( OR @STR )* _ ")" { return [h, ...t]; }


STR = '`' s:$[^\x60]* '`' { return s; }
IDEN "VarName" = $([a-z_]i [a-z0-9_]i*)
NONE = "none"i { return false; }
ARROW "->" = _ "->"_
COLON ":" = _ ":" _
COMMA "," = _ "," _
EQ "=" = _ "=" _
OR "|" = _ "|" _
_ "whitespace" = ([ \t\n\r] / Comment)*
Comment "Comment"
	= '/*' (
		[^\x2A] // Not *
		/ '*'![\x2F] // '*' Neg-Look-Ahead for '/'
	)* '*/' //{ return text().slice(2, -2).trim(); }
	/ '//' [^\x0A]* [\x0A]? //{ return text().slice(2).trim(); }


/********************************************************
EXAMPLE 1:

`main.php` -> {
	`home` : `home.php`,
	$user = `/[_a-z0-9]+/i` : `user.php` -> {
		`profile` : `user_profile.php`
	},
	`blog` : none -> {
		[$year = `/\d{4}/`, `-`, $month = `/\d{2}/`] : `blog_date.php`,
		$title = `/.{5}/` : `blog_title.php`
	},
	`about` : @`other.route`,
	(`xyz`|`zyx`) : `xyz.php` -> {
		`pqr` : `pqr.php`,
		`rst` : `rst.php`,
		`abc` : `abc.php`
	}
}
********************************************************
EXAMPLE 2:

`home.php` -> {
	[$bc = (`abc`|`xyz`), `_open`] : `text/3.php`,
	`p` : none -> {
		`q` : `pq.php`
	},
	`q` : @`q.route`
}
********************************************************/