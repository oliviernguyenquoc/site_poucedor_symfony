<?php

namespace Pouce\ContestantBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class DefaultController extends Controller
{
    public function indexAction($name)
    {
        return $this->render('PouceContestantBundle:Default:index.html.twig', array('name' => $name));
    }
}
