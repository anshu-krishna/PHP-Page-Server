<?php
namespace KPS\Config;

class Server {
	public function __construct(
		public string $views_dir,
		public readonly Msg $msg,
		public bool $dev_mode,
		// public bool $minify_html
	) {}
}