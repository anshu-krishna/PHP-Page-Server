<?php
namespace KPS\Peg;

use KPS\View;
use Krishna\Utilities\StaticOnlyTrait;

class HybridTemplateParser {
	use StaticOnlyTrait;
	private static function splitter($str) {
		$parts = preg_split('/(\[(?:\[|<|{))|({(?:{|<|\?))/', $str, 2, \PREG_SPLIT_OFFSET_CAPTURE|\PREG_SPLIT_DELIM_CAPTURE);
		if(count($parts) === 1) {
			return [$parts[0][0]];
		} else {
			$s0 = &$parts[0][0];
			$s1 = &$parts[1][0];
			$s2 = &$parts[2][0];
	
			$p1 = $parts[1][1] - 1;
			$p2 = $parts[1][1] - 2;
	
			if($p1 > -1 && $s0[$p1] === "\\") {
				if($p2 > -1 && $s0[$p2] === "\\") {
					$r = static::splitter($s2);
					if(count($r) > 1) {
						return [$s0 . $s1 . $r[0], $r[1]];
					} else {
						return [$s0 . $s1 . $r[0]];
					}
				} else {
					return [mb_substr($s0, 0, -1, 'UTF-8') , $s1 . $s2];
				}
			} else {
				return [$s0, $s1 . $s2];
			}
		}
	}
	public static function parser($parts) {
		$content = [];
		$parts = static::splitter($parts);
		$max_iter = -1;
		while(count($parts) > 1 && ++$max_iter < 10) {
			$content[] = [0, $parts[0]];
			try {
				$parts = View::$template_parser->parse($parts[1]);
				$content[] = $parts[0];
				$parts = static::splitter($parts[1]);
			} catch (\Throwable $th) {
				$last = &$content[count($content) - 1][1];
				$last = $last . mb_substr($parts[1], 0, 2, 'UTF-8');
				$parts = static::splitter(mb_substr($parts[1], 2, null, 'UTF-8'));
			}
		}
		$content[] = [0, $parts[0]];
		return $content;
	}
}