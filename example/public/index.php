<?php
namespace App;
require_once "../vendor/autoload.php";
use KPS\Server;
use KPS\ServerConfig;

ServerConfig::$dev_mode = true;
// ServerConfig::$pretty_debug = false;
Server::init();

Server::execute();