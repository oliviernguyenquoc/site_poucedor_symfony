<?php

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Debug\Debug;

// If you don't want to setup permissions the proper way, just uncomment the following PHP line
// read http://symfony.com/doc/current/book/installation.html#configuration-and-setup for more information
//umask(0000);

// This check prevents access to debug front controllers that are deployed by accident to production servers.
// Feel free to remove this, extend it, or make something more sophisticated.
if (!in_array(@$_SERVER['REMOTE_ADDR'], array('212.73.197.226','31.34.0.90','212.73.197.227','212.73.197.225','138.195.34.176','89.86.245.49','109.23.253.38','212.73.197.226','88.166.16.31','130.66.208.59','89.3.152.177','2.0.103.64', '77.153.149.193', '127.0.0.1', 'fe80::1', '::1'))
) 
{
    header('HTTP/1.0 403 Forbidden');
    exit('You are not allowed to access this file. Check '.basename(__FILE__).' for more information.');
}

$loader = require_once __DIR__.'/../app/bootstrap.php.cache';
Debug::enable();

require_once __DIR__.'/../app/AppKernel.php';

$kernel = new AppKernel('dev', true);
$kernel->loadClassCache();
$request = Request::createFromGlobals();
$response = $kernel->handle($request);
$response->send();
$kernel->terminate($request, $response);
