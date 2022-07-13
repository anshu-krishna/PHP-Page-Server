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





function dump($item) {
	echo '<pre>', htmlentities(json_encode($item, \JSON_PRETTY_PRINT)), '</pre>';
};

$html = <<<'EOF'
<!DOCTYPE html>
<body>
ab[[ `common/header.php` ]]
<p>
	Welcome to home page;
</p>
\[[ `common/header.php` ]]
<?php var_dump($_SERVER_CFG); ?>
</body>
</html>
EOF;

$t1 = <<<'EOF'
line 1
ab[[ `common/header.php` ]]
line2
EOF;

$t2 = <<<'EOF'
ab[[ `common/header.php` ]]
line2
EOF;

$t3 = <<<'EOF'
b[[ `common/header.php` ]]
line2
EOF;

$t4 = <<<'EOF'
[[ `common/header.php` ]]
line2
EOF;

$t5 = <<<'EOF'
line2
EOF;

$patt = '/(?:\[(?:\[|<|{))|(?:{(?:{|<|\?))/s';

function three_parts(string $str) {
	global $patt;
	preg_match($patt, $str, $p1, PREG_OFFSET_CAPTURE);
	$p1 = $p1[0][1] ?? -1;
	switch($p1) {
		case -1: return [null, null, $str];
		case 0: return [null, '', $str];
		case 1:
		case 2:
			return [
				null,
				substr($str, 0, $p1),
				substr($str, $p1, null)
			];
		default:
			$p2 = $p1 - 2;
			return [
				substr($str , 0, $p2),
				substr($str, $p2, 2),
				substr($str, $p1, null)
			];
	}
}

function splitter($str) {
	$final = [];
	$parts = three_parts($str);
	var_dump($parts);
	return $final;
}

foreach([$t1, $t2, $t3, $t4, $t5] as $t) {
	echo '<hr>';
	dump([
		// 'in' => $t,
		'out' => splitter($t)
	]);
	// echo $t;
}
// dump(splitter($html));