<?php
namespace KPS;

use KPS\Msg\Error as ErrMsg;
use KPS\Peg\HybridTemplateParser;
use KPS\Peg\TemplateParser;

class View {
	public static TemplateParser $template_parser;

	public readonly ?string $path;
	private $error = null;
	public function __construct(string $file_name, ?string $base_dir = null) {
		$this->path = Lib::resolve_path(Server::$CFG->views_dir, $file_name, $base_dir);
		if($this->path === null) {
			$this->error = [
				'View not found' => Server::$CFG->views_dir . "/{$file_name}"
			];
		}
	}
	public function content() : ?array {
		// Check if valid file;
		if($this->error !== null) {
			echo ErrMsg::create($this->error);
			return null;
		}
		// Init Variables
		$_SERVER_CFG = &\KPS\Server::$CFG;
		$_URL = &\KPS\Server::$_VALS['_URL'];
		$_QUERY = &\KPS\Server::$_VALS['_QUERY'];

		// Include content
		// $_1 = microtime(true);
		ob_start();
		include $this->path;
		$content = ob_get_clean();
		// $_2 = microtime(true);
		$content = HybridTemplateParser::parser($content);
		// $_3 = microtime(true);
		// $_32 = round(($_3 - $_2) * 1000, 3);
		// $_21 = round(($_2 - $_1) * 1000, 3);
		// $content[] = [0, "<pre>Include: {$this->path}\nImport = {$_21} ms\nParser = {$_32} ms</pre>"];

		return $content;
	}
}