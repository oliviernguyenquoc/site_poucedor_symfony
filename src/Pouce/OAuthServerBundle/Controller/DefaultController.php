<?php

namespace Pouce\OAuthServerBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class DefaultController extends Controller
{
    public function indexAction($name)
    {
        return $this->render('PouceOAuthServerBundle:Default:index.html.twig', array('name' => $name));
    }
}
