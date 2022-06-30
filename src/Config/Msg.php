<?php
namespace KPS\Config;

class Msg {
	public function __construct(
		public bool $prettify = true,
		public bool $as_comment = true,
		public bool $use_print_r = false
	) {}
}