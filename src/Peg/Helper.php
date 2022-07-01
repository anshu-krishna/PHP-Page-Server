<?php
namespace KPS\Peg;

use Krishna\Utilities\StaticOnlyTrait;

class Helper {
	use StaticOnlyTrait;
	public static function makeChar($digits, $base) {
		return chr_unicode(intval($digits, $base));
	}
}