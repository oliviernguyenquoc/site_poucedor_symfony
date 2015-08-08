<?php

namespace Pouce\SiteBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class SiteController extends Controller
{
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
    public function classementAction($annee)
    {
        return $this->render('PouceSiteBundle:Site:classement_'.$annee.'.html.twig');
    }
}
