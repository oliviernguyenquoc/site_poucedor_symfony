<?php

// src/PO/PlatformeBundle/Controller/AdvertController.php

namespace PO\PlatformeBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Response;

class AdvertController extends Controller
{
    public function indexAction()
    {
        $content = $this->get('templating')->render('POPlatformeBundle:Advert:index.html.twig');
    	return new Response($content);
    }
}