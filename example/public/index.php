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
	),
	minify_html: false
);

Server::execute();