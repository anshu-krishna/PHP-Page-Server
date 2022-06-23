<?php
namespace App;
require_once "../vendor/autoload.php";
use KPS\Server;
use KPS\ServerConfig;

ServerConfig::$dev_mode = true;
ServerConfig::$pretty_debug = false;
// ServerConfig::$dump_trace_on_error = false;
Server::init();

Server::execute();