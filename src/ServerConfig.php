<?php
namespace KPS;

final class ServerConfig {
	use \Krishna\Utilities\StaticOnlyTrait;
	public static bool $dev_mode = false;
	public static bool $pretty_debug = true;
}