/*********************** GRAMMER ***********************/
{
	function makeMatchResult(list) {
		const storeEntries = list.map((item, idx) => [item[0], idx]).filter(item => item[0] !== null);
		const m = list.map(i => i[1]);
		return storeEntries.length ? { match: m, store: Object.fromEntries(storeEntries) } : { match: m };
	}
	function sanitise_route_match_str(m) {
		if(m.startsWith('/')) {
			const i = m.at(-2) === '/';
			m = m.slice(1, i ? -2 : -1);
			m = '/(' + m + ')/' + (i ? 'i' : '');
		}
		return m;
	}
	/**<?php ?>**/
}

Exp = _ r:Route _ { return r; /**<?php return $r; ?>**/ }
Route
	= "@" r:STR { return { import: r }; /**<?php return ['import' => $r]; ?>**/ }
	/ v:(STR / NONE) n:(ARROW "{" _ n:Next _ "}" { return n; /**<?php return $n; ?>**/ })? {
			const ret = { view: v };
			if(n !== null) { ret.nxt = n; }
			return ret;
			/**<?php
			$ret = [ 'view' => $v ];
			if($n !== null) { $ret['nxt'] = $n; }
			return $ret;
			?>**/
		}

Next = h:NextItem t:( COMMA n:NextItem { return n; /**<?php return $n; ?>**/ })* COMMA? { return [h, ...t]; /**<?php return [$h, ...$t]; ?>**/ }
NextItem = m:Matches COLON r:Route { return { ...m, ...r }; /**<?php return [...$m, ...$r];  ?>**/ }

Matches
	= m:Match { return makeMatchResult([m]); /**<?php return Helper::makeMatchResult([$m]); ?>**/ }
	/ "[" _ h:Match t:( COMMA m:Match { return m; /**<?php return $m; ?>**/ })* COMMA? _ "]" {
		return makeMatchResult([h, ...t]); /**<?php return Helper::makeMatchResult([$h, ...$t]); ?>**/
	}
Match = s:("$" i:IDEN EQ { return i; /**<?php return $i; ?>**/ })? MatchStr // [0] = store; [1] = Match options
MatchStr
	= h:STR t:(
		OR s:STR { return sanitise_route_match_str(s); /**<?php return Helper::sanitise_route_match_str($s); ?>**/ }
	)* { return [sanitise_route_match_str(h), ...t]; /**<?php return [Helper::sanitise_route_match_str($h), ...$t]; ?>**/ }
	/ "(" _ h:STR t:(
		OR s:STR { return sanitise_route_match_str(s); /**<?php return Helper::sanitise_route_match_str($s); ?>**/ }
	)* _ ")" { return [sanitise_route_match_str(h), ...t]; /**<?php return [Helper::sanitise_route_match_str($h), ...$t];  ?>**/ }

STR = '`' s:$[^\x60]* '`' { return s; /**<?php return $s; ?>**/ }
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
	`blog` : none -> {
		[$year = `/\d{4}/`, `-`, $month = `/\d{2}/`] : `blog_date.php`,
		$title = `/.{5}/` : `blog_title.php`
	},
	//`about` : @`other.route`,
	(`xyz`|`zyx`) : `xyz.php` -> {
		`pqr` : `pqr.php`,
		`rst` : `rst.php`,
		`abc` : `abc.php`
	},
	$user = `/[_a-z0-9]+/i` : `user.php` -> {
		`profile` : `user_profile.php`
	},
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