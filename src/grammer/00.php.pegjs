PathExp
	= "@" p:Paths "@" { return $p; }
	/ "<@" p:Paths "@>" {
		for($i=0, $j=count($p); $i<$j; $i++){ $p[$i]['en'] = true; }
		return $p;
	}
Paths = _ head:Path tail:(PIPE p:Path { return $p; })* PIPE? { return [$head, ...$tail]; }
Path = p:$[^@|]+ {
		return [
			'at' => location()['start']['line'],
			'en' => false,
			'ty' => 'path',
			'val' => trim($p)
		];
	}
// ----- Other -----
_ "whitespace" = [ \t\n\r]*

// ----- Symbols -----
PIPE = _ "|" _