<?php

namespace Pouce\SuperAdminBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;

use Doctrine\ORM\NoResultException;

use Pouce\TeamBundle\Entity\Position;
use Pouce\TeamBundle\Entity\Result;

class SuperAdminController extends Controller
{
    /**
    * Gere la page super admin
    */
    public function superAdminAction()
    {
        $repository = $this->getDoctrine()->getManager();
        $repositoryEdition = $repository->getRepository('PouceSiteBundle:Edition');
        $editionArray = $repositoryEdition->findAll();

        return $this->render('PouceSuperAdminBundle:Admin:superListeEditions.html.twig', array(
                'editionArray' => $editionArray
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

        $repositorySchool = $repository->getRepository('PouceUserBundle:School');
        $schoolArray = $repositorySchool->findBy([], ['name' => 'ASC']);

        return $this->render('PouceSuperAdminBundle:Admin:config.html.twig', array(
                'editions'  => $editionArray,
                'schools'   => $schoolArray
            ));
    }

    public function addPositionInitialAction($editionId)
    {
        $em = $this->getDoctrine()->getManager(); 
        $repositoryTeam = $em->getRepository('PouceTeamBundle:Team');
        $repositoryUser = $em->getRepository('PouceUserBundle:User');
        $repositoryResult = $em->getRepository('PouceTeamBundle:Result');


        $teamArray = $repositoryTeam->findByEdition($editionId);

        foreach($teamArray as $key=>$team)
        {
            $position = new Position();
            $user = $repositoryUser->findAUserOfTeam($team);
            $position->setTeam($team);
            $position->setDistance(0);
            $position->setCity($user->getSchool()->getCity());

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

    /**
    *   Gère la page d'administration des responsable du Pouce d'Or : Toutes les équipes (page récapitulative de leurs équipes ...)
    */
    public function superOrganisationPageAction($editionId)
    {
        $em = $this->getDoctrine()->getManager();      
        $repositorySchool = $em->getRepository('PouceUserBundle:School');

        $schools = $repositorySchool->findAllSchoolParticipateByEdition($editionId);

        return $this->render('PouceSuperAdminBundle:Admin:checkAllParticipants.html.twig', array(
                'schools'   => $schools,
                'editionId' => $editionId
            ));
    }

    /**
    *   Gère la page d'administration des responsable du Pouce d'Or : Toutes les équipes (page récapitulative de leurs équipes ...)
    *   Gère école par école pour constituer la page globale des superadmins
    */
	public function checkParcipantsEditionAction($editionId,$schoolId)
    {
        $em = $this->getDoctrine()->getManager();            
        $repositoryTeam = $em->getRepository('PouceTeamBundle:Team');
        $repositorySchool = $em->getRepository('PouceUserBundle:School');

        $school = $repositorySchool->find($schoolId);

        $teamArray = $repositoryTeam->findAllTeamsBySchool($schoolId,$editionId);

        $teamIdArray = $this->createTeamIdArray($teamArray);

        return $this->render('PouceAdminBundle:Admin:checkParticipantsBlock.html.twig', array(
                'teams' => $teamIdArray,
                'school'    => $school
            ));
    }

    /**
    *   Récupère tous les utilisateurs pour afficher la page de gestions de droits
    */
    public function manageRoleAction()
    {
        $em = $this->getDoctrine()->getManager();
        $repositoryUser = $em->getRepository('PouceUserBundle:User');

        $users = $repositoryUser->findBy(array(), array('id' => 'DESC'));

        return $this->render('PouceSuperAdminBundle:Admin:manageRoles.html.twig', array(
                'users' => $users
            ));
    }

    /**
    *   Fonction permettant de creer le vecteur des teams avec leurs positions
    *   afin d'avoir un bon format pour l'afficher dans la vue
    */
    private function createTeamIdArray($teamArray)
    {
    	$em = $this->getDoctrine()->getManager();
    	$repositoryPosition = $em->getRepository('PouceTeamBundle:Position');

    	$teamIdArray=[];

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

        return $teamIdArray;
    }
}
