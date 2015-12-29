<?php

namespace Pouce\SiteBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;

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

    public function listeInscritsAction()
    {
        $em = $this->getDoctrine()->getManager();
        $repositoryEdition = $em->getRepository('PouceSiteBundle:Edition');
        $repositoryUser = $em->getRepository('PouceUserBundle:User');
        $repositorySchool = $em->getRepository('PouceUserBundle:School');

        $editions = $repositoryEdition->findEditionsThisYear();
        $schools = $repositorySchool->findAll();

        $editionWithUserArray = [];

        foreach ($editions as $key1 => $edition)
        {
            $i=0;

            foreach ($schools as $key2 => $school) {
                $nbUser = $repositoryUser->getNbOfUserInTeam($edition->getId(),$school->getId());
                if($nbUser!=0)
                {
                    $editionWithUserArray[$key1][$i][0] = $edition;
                    $editionWithUserArray[$key1][$i][1] = $school;
                    $editionWithUserArray[$key1][$i][2] = $nbUser;
                    $i+=1;
                }
            }
       }

        return $this->render('PouceSiteBundle:Site:listeInscrits.html.twig', array(
          'editionArray'    => $editionWithUserArray
        ));
    }

}
