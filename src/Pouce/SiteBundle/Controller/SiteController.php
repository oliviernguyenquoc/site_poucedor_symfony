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
    public function licenceAction()
    {
        return $this->render('PouceSiteBundle:Site:licence.html.twig');
    }
    public function inscriptionEcoleAction()
    {
        return $this->render('PouceSiteBundle:Site:inscriptionEcole.html.twig');
    }
    public function galeryAction($idEdition)
    {
        $dir = $this->get('kernel')->getRootDir(). '/../web/photos/' . $idEdition;
        //$fulldir = "{$_SERVER['DOCUMENT_ROOT']}"."$dir";
        $d = scandir($dir) or die('Failed opening directory for reading');

        foreach ($d as $keyDirectory => $directory1) 
        {
            if(is_dir($dir . '/' . $directory1)) 
            {
                $directory2 = scandir($dir . '/' . $directory1);
                foreach ($directory2 as $key => $imageName) 
                {
                    if(is_file($dir . '/' . $directory1 . '/' . $imageName) and $imageName[0] != '.')
                    {
                        $imageArray[] = array(
                        "url" => 'photos/' . $idEdition . '/' . $directory1 . '/' . $imageName
                        );
                    }
                }
            }
        }
            


        return $this->render('PouceSiteBundle:Site:galery.html.twig', array(
          'imageArray'    => $imageArray
        ));
    }
}
