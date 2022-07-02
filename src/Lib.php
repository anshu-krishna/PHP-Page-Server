<?php
namespace KPS;

use Krishna\Utilities\StaticOnlyTrait;

class Lib {
	use StaticOnlyTrait;
	public static function html_esc(string $value) {
		return htmlspecialchars(
			string: $value, encoding: 'UTF-8',
			flags: ENT_SUBSTITUTE | ENT_NOQUOTES | ENT_HTML5
		);
	}
}