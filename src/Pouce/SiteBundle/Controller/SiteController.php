<?php

namespace Pouce\SiteBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class SiteController extends Controller
{
	public function indexAction()
    {
        return $this->render('PouceSiteBundle:Site:index.html.twig');
    }
    // public function menuAction($page)
    // {
    //     return $this->render('PouceSiteBundle:Site:index.html.twig');
    // }

//     public function getOptions()
//     {

//     }
}
