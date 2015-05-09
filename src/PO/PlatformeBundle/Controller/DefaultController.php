<?php

namespace PO\PlatformeBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class DefaultController extends Controller
{
    public function indexAction($name)
    {
        return $this->render('POPlatformeBundle:Default:index.html.twig', array('name' => $name));
    }
}
