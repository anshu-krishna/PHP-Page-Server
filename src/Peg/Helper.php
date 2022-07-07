<?php
namespace KPS\Peg;

use Krishna\Utilities\StaticOnlyTrait;

class Helper {
	use StaticOnlyTrait;
	public static function makeChar($digits, $base) {
		return chr_unicode(intval($digits, $base));
	}
	public static function makeMatchResult(array $list) {
		$store = []; $m = []; $idx = 0;
		foreach($list as $i) {
			$m[] = $i[1];
			if($i[0] !== null) {
				$store[$i[0]] = $idx;
			}
			$idx++;
		}
		$ret = [ 'match' => $m ];
		if(count($store) > 0) {
			$ret['store'] = $store;
		}
		return $ret;
	}

	public static array $view_content = [];
	public static array $view_html = [];
	public static function view_reset_html() {
		if(count(static::$view_html) > 0) {
			static::$view_content[] = [0, implode('', static::$view_html)];
			static::$view_html = [];
		}
	}
	public static function view_add_content($item) {
		static::view_reset_html();
		static::$view_content[] = $item;
	}
}