<?php

namespace Pouce\SiteBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Doctrine\ORM\NoResultException;
use Pouce\UserBundle\Entity\User;
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
    *   Gère la page d'administration des responsable du Pouce d'Or : Toutes les équipes (page récapitulative de leurs équipes ...)
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

    /**
    * Gêre la page de configuration : ajout d'édition, démarage de la course ...
    */
    public function configAction()
    {
        $repository = $this->getDoctrine()->getManager();

        $repositoryEdition = $repository->getRepository('PouceSiteBundle:Edition');
        $editionArray = $repositoryEdition->findAll();


        return $this->render('PouceSiteBundle:Admin:config.html.twig', array(
                'editions' => $editionArray
            ));
    }

    public function addPositionInitialAction($editionId)
    {
        $em = $this->getDoctrine()->getManager(); 
        $repositoryTeam = $em->getRepository('PouceTeamBundle:Team');
        $repositoryUser = $em->getRepository('PouceUserBundle:User');
        $repositoryEdition = $em->getRepository('PouceSiteBundle:Edition');
        $repositoryResult = $em->getRepository('PouceTeamBundle:Result');


        $teamArray = $repositoryTeam->findByEdition($editionId);

        foreach($teamArray as $key=>$team)
        {
            $position = new Position();
            $user = $repositoryUser->findAUserOfTeam($team);
            $position->setTeam($team);
            $position->setDistance(0);
            $position->setLongitude($user->getSchool()->getLongitude());
            $position->setLatitude($user->getSchool()->getLatitude());
            $position->setEdition($repositoryEdition->find($editionId));

            // On cherche le record de la team (pour l'instant) s'il existe
            $result = $repositoryResult->findOneBy(
                array(
                    'team' => $team->getId(),
                    'edition' => $editionId
                    )
                );

            if($result==NULL)
            {
                $result = new Result();
                $result->setEdition($repositoryEdition->find($editionId));
                $result->setTeam($team);
                $result->setPosition($position);
                $result->setLateness(0);
                $result->setIsValid(false);
                $result->setRank(0);
                $em->persist($result);
            }            

            $em->persist($position);
            
        }
        $em->flush();

        return $this->redirectToRoute('pouce_site_homepage');
    }

    public function mapAction($editionId)
    {
        $repository = $this->getDoctrine()->getManager();   
        $repositoryTeam = $repository->getRepository('PouceTeamBundle:Team');
        $repositoryResult = $repository->getRepository('PouceTeamBundle:Result');

        $resultArray = $repositoryResult->getAllResultsInEdition($editionId);

        return $this->render('PouceSiteBundle:Site:map.html.twig', array(
                'results' => $resultArray
            ));
    }
}
