<?php
namespace KPS;

final class ServerConfig {
	use \Krishna\Utilities\StaticOnlyTrait;
	public static bool $dev_mode = false;
	public static bool $pretty_debug = true;
	public static bool $dump_trace_on_error = true;
}