<?php

namespace Pouce\SiteBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class SiteController extends Controller
{
	public function indexAction()
    {
        return $this->render('PouceSiteBundle:Site:index.html.twig');
    }
    public function reglesAction()
    {
        return $this->render('PouceSiteBundle:Site:regles.html.twig');
    }
        public function archivesAction()
    {
        return $this->render('PouceSiteBundle:Site:archives.html.twig');
    }
    public function assoAction()
    {
        return $this->render('PouceSiteBundle:Site:asso.html.twig');
    }
    public function conseilsAction()
    {
        return $this->render('PouceSiteBundle:Site:conseils.html.twig');
    }
    public function editionAction()
    {
        return $this->render('PouceSiteBundle:Site:edition.html.twig');
    }
    public function editionPrecedenteAction()
    {
        return $this->render('PouceSiteBundle:Site:editions_precedentes.html.twig');
    }
    public function liensAction()
    {
        return $this->render('PouceSiteBundle:Site:liens.html.twig');
    }
    public function organisateursAction()
    {
        return $this->render('PouceSiteBundle:Site:organisateurs.html.twig');
    }
    public function videosAction()
    {
        return $this->render('PouceSiteBundle:Site:videos.html.twig');
    }
    public function recordsAction()
    {
        return $this->render('PouceSiteBundle:Site:records.html.twig');
    }
    // public function menuAction($page)
    // {
    //     return $this->render('PouceSiteBundle:Site:index.html.twig');
    // }

//     public function getOptions()
//     {

//     }
}
