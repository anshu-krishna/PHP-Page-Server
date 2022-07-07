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

//Server::execute();


$txt = <<<EOF
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>ABC</title>
</head>
<body>
[[ `app/header.php` ]]
\\[[ `app/header.php` ]]
\\\\[[ `app/header.php` ]]
{? _REQ_ ?}
</body>
</html>
EOF;

// var_dump($txt);

$open = ["[[", "[<", "[-", "{{", "{<", "{?"];
$close = ["]]", ">]", "-]", "}}", ">}", "?}"];

$parts = [];
$tok = strtok($txt, "[");
$parts[] = $tok;
$tok = strtok("[<-");
$parts[] = $tok;
$tok = strtok("->]");
$parts[] = $tok;
$tok = strtok("]");
$parts[] = $tok;
var_dump($parts);