<?php
namespace KPS;

use Krishna\Utilities\JSON;
use Krishna\Utilities\StaticOnlyTrait;

class Lib {
	use StaticOnlyTrait;
	public static function html_esc(string $value) {
		return htmlspecialchars(
			string: $value, encoding: 'UTF-8',
			flags: ENT_SUBSTITUTE | ENT_NOQUOTES | ENT_HTML5
		);
	}

	public static function stringfiy(mixed $value) : ?string {
		if(is_string($value)) { return $value; }
		if(
			$value === null
			|| is_scalar($value)
			|| (is_object($value) && method_exists($value, '__toString'))
		) { return strval($value); }
		return JSON::encode($value);
	}

	public static function stringify_index_chain(array $chain) {
		$r = ["{$chain[0]}"];
		$i = 1; $max = count($chain);
		while($i < $max) {
			$r[] = "[{$chain[$i]}]";
			$i++;
		}
		return implode('', $r);
	}

	public static function resolve_val_chain(array $start, array $keys) : ?string {
		$ret = $start;
		foreach($keys as $k) {
			if(is_array($ret) && array_key_exists($k, $ret)) {
				$ret = $ret[$k];
			} else {
				return null;
			}
		}
		return static::stringfiy($ret);
	}

	public static function resolve_path(string $default_base, string $find, ?string $base = null) : ?string {
		if(str_starts_with($find, '.')) {
			$base ??= $default_base;
			$path = "{$base}/{$find}";
			if(is_readable($path)) { return $path; }
			return null;
		}
		$path = $default_base . "/{$find}";
		if(is_readable($path)) { return $path; }
		if(is_readable($find)) { return $find; }
		return null;
	}
}