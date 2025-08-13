<?php
namespace KPS\Peg;

use KPS\View;
use Krishna\Utilities\StaticOnlyTrait;

class HybridTemplateParser {
	use StaticOnlyTrait;
	private static $patt = '/(?:\[(?:\[|<|-))|(?:{(?:{|<|\?))/s';
	private static function three_parts(string $str) {
		preg_match(static::$patt, $str, $p1, PREG_OFFSET_CAPTURE);
		$p1 = $p1[0][1] ?? -1;
		switch($p1) {
			case -1: return [null, null, $str];
			case 0: return [null, '', $str];
			case 1:
			case 2:
				return [
					null,
					substr($str, 0, $p1),
					substr($str, $p1, null)
				];
			default:
				$p2 = $p1 - 2;
				return [
					substr($str , 0, $p2),
					substr($str, $p2, 2),
					substr($str, $p1, null)
				];
		}
	}
	public static function parser($str) {
		$final = [];
		$push_txt = function ($txt) use (&$final) {
			if($txt !== null && strlen($txt)) {
				$final[] = [0, $txt];
			}
		};
	
		$p = static::three_parts($str);
	
		while($p[1] !== null) {
			$a = &$p[0]; $b = &$p[1]; $c = &$p[2];
			// var_dump($p);
			$parse = true;
			$a ??= '';
			if(($b[1] ?? null) === "\\") {
				if($b === "\\\\") {
					// Parse
					$a .= $b;
				} else {
					//Dont parse
					$parse = false;
					$a .= $b[0];
				}
			} else {
				// Parse
				$a .= $b;
			}
			$txt = $p[0];
			if($parse) {
				try {
					$p = \KPS\View::$template_parser->parse($c);
					$push_txt($txt);
					$final[] = $p[0];
					$p = static::three_parts($p[1]);
				} catch (\Throwable $th) {
					$txt .= substr($c, 0, 2);
					$p = static::three_parts(substr($c, 2));
					$push_txt($txt);
				}
			} else {
				$txt .= substr($c, 0, 2);
				$p = static::three_parts(substr($c, 2));
				$push_txt($txt);
			}
		}
		$push_txt($p[2]);
		return $final;
	}
}