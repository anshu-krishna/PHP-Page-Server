<?php
namespace KPS;

use KPS\Msg\Error as ErrMsg;
use KPS\Peg\RouteParser;

class Route {
	public static RouteParser $route_parser;

	private ?array $match = null;
	private array $store;
	private string|false $view;
	private array $nxt = [];
	private ?string $import = null;

	public function __construct(array $data) {
		if(isset($data['match'])) {
			$this->match = $data['match'];
		}
		if(isset($data['import'])) {
			$path = Lib::resolve_path(Server::$CFG->routes_dir, $data['import']);
			if($path === null) {
				throw new \Exception("Route file missing: " . Server::$CFG->routes_dir . "/{$data['import']}");
			}
			$this->import = $path;
			return;
		}
		$this->view = $data['view'];
		$this->store = $data['store'] ?? [];

		foreach($data['nxt'] ?? [] as $n) {
			$this->nxt[] = new static($n);
		}
	}

	private function import() {
		if($this->import === null) { return; }
		try {
			$data = static::$route_parser->parse(file_get_contents($this->import));
			$this->import = null;
			$this->view = $data['view'];
			$this->store = $data['store'] ?? [];
			foreach($data['nxt'] ?? [] as $n) {
				$this->nxt[] = new static($n);
			}
		} catch(\KPS\Peg\SyntaxError $th) {
			throw new \Exception("Invalid route file: {$this->import}; Line: {$th->grammarLine}; Message: {$th->getMessage()}");
		}
	}

	private function match_item(string $path_item) {
		$this->import();
		if($this->match === null) {
			return $path_item === '';
		}
		$matched = [];
		foreach($this->match as $m) { // For each part of pattern
			$f = false; // Flag: Found
			foreach($m as $alt) { // For each alternative part
				if('/' === ($alt[0] ?? '')) { // Is regex
					// Split and check
					$parts = preg_split($alt, $path_item, 2, PREG_SPLIT_DELIM_CAPTURE);
					if(count($parts) === 3 && $parts[0] === '') {
						$matched[] = $parts[1];
						$path_item = $parts[2];
						$f = true;
						break;
					}
				} else { // Not regex
					if(\str_starts_with($path_item, $alt)) {
						$matched[] = $alt;
						$path_item = substr($path_item, strlen($alt));
						$f = true;
						break;
					}
				}
			}
			// Not found
			if($f === false) { break; }
		}
		// Item has remaining char or all pattern parts not matched
		if(strlen($path_item) > 0 || count($matched) !== count($this->match)) {
			return false;
		}
		// Store pathvars
		$vars = &Server::$_VALS['_REQ_']['pathvars'];
		foreach($this->store as $k => $idx) {
			$vars[$k] = $matched[$idx];
		}
		return true;
	}

	public function find_view(array $path) : string|false {
		$this->import();
		$node = $this;
		foreach($path as $item) {
			$no_nxt = true;
			foreach($node->nxt as $n) {
				if($n->match_item($item)) {
					$node = $n;
					$no_nxt = false;
					break;
				}
			}
			if($no_nxt) { return false; }
		}
		return $node->view;
	}
}