<?php
namespace KPS;

use Krishna\Utilities\StaticOnlyTrait;

final class Debugger {
	use StaticOnlyTrait;
	
	private static function get_function_name($trace) : string {
		$name = $trace['class'] ?? null;
		if($name === null) {
			return $trace['function'];
		} else {
			return $name . '::' . $trace['function'];
		}
	}

	public static function trace_call_point(?string $func_name = null) : array {
		$trace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS);
		if($func_name === null) {
			$trace = $trace[2] ?? $trace[1] ?? $trace[0];
		} else {
			$found = false;
			$trace_count = count($trace) - 1;
			for($i = $trace_count; $i >= 0; $i--) {
				$name = self::get_function_name($trace[$i]);
				if($name === $func_name) {
					$found = true;
					break;
				}
			}
			if($found) {
				$trace = $trace[$i];
			} else {
				$trace = $trace[$trace_count];
			}
		}
		$trace['file'] ??= 'Unknown';
		$trace['line'] ??= 'Unknown';
		$location = [
			'at' => "File: {$trace['file']}; Line: {$trace['line']}",
			'call_to' => self::get_function_name($trace)
		];
		return $location;
	}

	public static function dump(
		mixed $value,
		?string $title = null,
		?string $callpoint = null,
		bool $echo = true
	) : array {
		$trace = self::trace_call_point($callpoint ?? (__METHOD__));
		unset($trace['call_to']);
		if($title !== null) { $trace['title'] = $title; }
		$trace['value'] = $value;
		if($echo) { Server::echo_debug($trace); }
		return $trace;
	}
}