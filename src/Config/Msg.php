<?php
namespace KPS\Config;

use KPS\Server;

class Msg {
	public function __construct(
		public bool $prettify = true,
		public bool $as_comment = true,
		public bool $use_print_r = false
	) {}
	public static function override(
		?bool $prettify = null,
		?bool $as_comment = null,
		?bool $use_print_r = null,
	) : static {
		$def = Server::$CFG->msg;
		$prettify ??= $def->prettify;
		$as_comment ??=$def->as_comment;
		$use_print_r ??=$def->use_print_r;
		return new static($prettify, $as_comment, $use_print_r);
	}
}