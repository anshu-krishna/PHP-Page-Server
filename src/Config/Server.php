<?php
namespace KPS\Config;

class Server {
	public function __construct(
		public bool $dev_mode,
		public string $views_dir,
		public readonly Msg $msg,
	) {}
}