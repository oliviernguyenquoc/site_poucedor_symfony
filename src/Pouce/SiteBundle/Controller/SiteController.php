<?php

namespace Pouce\SiteBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Doctrine\ORM\NoResultException;

use Pouce\TeamBundle\Entity\Position;
use Pouce\TeamBundle\Entity\Result;

class SiteController extends Controller
{
    public function galeryAction($idEdition)
    {
        $dir = $this->get('kernel')->getRootDir(). '/../web/photos/' . $idEdition;

        $d = scandir($dir);

        foreach ($d as $keyDirectory => $directory1) 
        {
            if(is_dir($dir . '/' . $directory1)) 
            {
                $directory2 = scandir($dir . '/' . $directory1);
                foreach ($directory2 as $key => $imageName) 
                {
                    if(is_file($dir . '/' . $directory1 . '/' . $imageName) && $imageName[0] != '.')
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
        return $this->render('PouceSiteBundle:Site:classement'.$annee.'.html.twig');
    }

}
