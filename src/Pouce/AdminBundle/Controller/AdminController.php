<?php

namespace Pouce\AdminBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class AdminController extends Controller
{
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

        return $this->render('PouceAdminBundle:Admin:checkParticipants.html.twig', array(
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

        return $this->render('PouceAdminBundle:Admin:listeEditions.html.twig', array(
                'editionArray' => $editionArray
            ));
    }
}
