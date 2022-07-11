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
	public static string $view_html = '';
	public static function view_reset_html() {
		if(strlen(static::$view_html) > 0) {
			static::$view_content[] = [0, static::$view_html];
			static::$view_html = '';
		}
	}
	public static function view_add_content($item) {
		static::view_reset_html();
		static::$view_content[] = $item;
	}
	public static function sanitise_route_match_str(string $m) {
		if('/' === ($m[0] ?? '')) { // Is regex
			// Sanitize regex pattern
			$i = substr($m, -2, 1) === '/';
			$m = substr($m, 1, $i ? -2: -1);
			$m = '/(' . $m . ')/' . ($i ? 'i' : '');
		}
		return $m;
	}
}