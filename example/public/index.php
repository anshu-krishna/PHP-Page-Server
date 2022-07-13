<?php
namespace App;

use KPS\Server;

require_once "../vendor/autoload.php";

Server::init(
	dev_mode: true,
	msg_config: new \KPS\Config\Msg(
		prettify: true,
		as_comment: true,
		use_print_r: false
	)
);

// Server::execute();


$html = <<<'EOF'
hksdafhhlsdajdhldsa
\\[[ `common/1.php` ]]
[[ `common/2.php` ]]
[<i>2</i>] \[[ `common/3.php` ]] <i>public</i> <i>string</i>
EOF;
$html2 = <<<'EOF'
jdsa l;adsj lsd;f
EOF;

function splitter($str) {
	$parts = preg_split('/(\[(?:\[|<|{))|({(?:{|<|\?))/', $str, 2, \PREG_SPLIT_OFFSET_CAPTURE|\PREG_SPLIT_DELIM_CAPTURE);
	if(count($parts) === 1) {
		return [$parts[0][0]];
	} else {
		$s0 = &$parts[0][0];
		$s1 = &$parts[1][0];
		$s2 = &$parts[2][0];

		$p1 = $parts[1][1] - 1;
		$p2 = $parts[1][1] - 2;

		// var_dump($parts);

		if($p1 > -1 && $s0[$p1] === "\\") {
			if($p2 > -1 && $s0[$p2] === "\\") {
				$r = splitter($s2);
				if(count($r) > 1) {
					return [$s0 . $s1 . $r[0], $r[1]];
				} else {
					return [$s0 . $s1 . $r[0]];
				}
			} else {
				return [mb_substr($s0, 0, -1, 'UTF-8') , $s1 . $s2];
			}
		} else {
			return [$s0, $s1 . $s2];
		}
	}
}
var_dump(splitter($html2));
var_dump(splitter($html));