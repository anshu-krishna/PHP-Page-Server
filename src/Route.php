<?php
namespace KPS;

use KPS\Peg\RouteParser;

class Route {
	public static RouteParser $route_parser;

	private string|false|null $view = null;
	private array $nxt = [];
	private array $store = [];
	
}