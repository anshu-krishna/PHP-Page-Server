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
}