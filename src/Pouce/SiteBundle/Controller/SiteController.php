<?php

namespace Pouce\SiteBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Doctrine\ORM\NoResultException;
use Pouce\UserBundle\Entity\User;

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
        return $this->render('PouceSiteBundle:Site:classement'.$annee.'.html.twig');
    }

    /**
    *   Gère la page d'administration des chefs pouceux (page récapitulative de leurs équipes ...)
    */
    public function organisationPageAction($editionId)
    {
        $user = $this->getUser();
        $schoolId = $user->getSchool()->getId();

        $repository = $this->getDoctrine()->getManager();
            
        $repositoryTeam = $repository->getRepository('PouceTeamBundle:Team');
        $repositoryPosition = $repository->getRepository('PouceTeamBundle:Position');

        $teamArray = $repositoryTeam->findAllTeamsBySchool($schoolId,$editionId);

        foreach($teamArray as $key=>$team)
        {
            $teamIdArray[$key][0] = $teamArray[$key];
            $teamIdArray[$key][1] = null;
        }

        foreach($teamArray as $key=>$team)
        {
            try
            {
                $teamIdArray[$key][1] = $repositoryPosition->findLastPosition($team->getId())->getSingleResult();
            }
            catch(NoResultException $e)
            {
                $teamIdArray[$key][1] = null;
            }
        }

        return $this->render('PouceSiteBundle:Admin:checkParticipants.html.twig', array(
                'teams' => $teamIdArray
            ));
    }

     /**
    *   Gère la page d'administration des chefs pouceux (liste des éditions auxquelles leur école a participé ...)
    */
    public function participationEcoleAdminPageAction()
    {
        $user = $this->getUser();
        $schoolId = $user->getSchool()->getId();

        $repository = $this->getDoctrine()->getManager();
        $repositoryEdition = $repository->getRepository('PouceSiteBundle:Edition');

        $editionArray = $repositoryEdition->findAllEditionsBySchool($schoolId);

        return $this->render('PouceSiteBundle:Admin:listeEditions.html.twig', array(
                'editionArray' => $editionArray
            ));
    }

    /**
    * Gere la page super admin
    */
    public function superAdminAction()
    {
        $repository = $this->getDoctrine()->getManager();
        $repositoryEdition = $repository->getRepository('PouceSiteBundle:Edition');
        $editionArray = $repositoryEdition->findAll();

        return $this->render('PouceSiteBundle:Admin:superListeEditions.html.twig', array(
                'editionArray' => $editionArray
            ));

    }

    /**
    *   Gère la page d'administration des chefs pouceux (page récapitulative de leurs équipes ...)
    */
    public function superOrganisationPageAction($editionId)
    {
        $repository = $this->getDoctrine()->getManager();
            
        $repositoryTeam = $repository->getRepository('PouceTeamBundle:Team');
        $repositoryPosition = $repository->getRepository('PouceTeamBundle:Position');

        $teamArray = $repositoryTeam->findByEdition($editionId);

        foreach($teamArray as $key=>$team)
        {
            $teamIdArray[$key][0] = $teamArray[$key];
            $teamIdArray[$key][1] = null;
        }

        foreach($teamArray as $key=>$team)
        {
            try
            {
                $teamIdArray[$key][1] = $repositoryPosition->findLastPosition($team->getId())->getSingleResult();
            }
            catch(NoResultException $e)
            {
                $teamIdArray[$key][1] = null;
            }
        }

        return $this->render('PouceSiteBundle:Admin:checkParticipants.html.twig', array(
                'teams' => $teamIdArray
            ));
    }
}
