<?php

// src/PO/PlatformeBundle/Controller/AdvertController.php

namespace PO\PlatformeBundle\Controller;

use Symfony\Component\HttpFoundation\Response;

class AdvertController
{
    public function indexAction()
    {
        return new Response("Hello World !");
    }
}