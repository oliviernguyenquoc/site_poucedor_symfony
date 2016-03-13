<?php

namespace Pouce\AdminBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

use Doctrine\ORM\NoResultException;

class AdminController extends Controller
{
	/**
    *   Gère la page d'administration des chefs pouceux (page récapitulative de leurs équipes ...)
    */
    public function organisationPageAction($schoolId, $editionId)
    {
        $user = $this->getUser();
        $schoolUserId = $user->getSchool()->getId();

        if(!(($user->hasRole('ROLE_CHEFPOUCEUX') && $schoolUserId==$schoolId ) || $user->isGranted('ROLE_SUPER_ADMIN')))
        {
            throw new AccessDeniedException();
        }

        $em = $this->getDoctrine()->getManager();
            
        $repositoryTeam = $em->getRepository('PouceTeamBundle:Team');
        $repositoryPosition = $em->getRepository('PouceTeamBundle:Position');
        $repositorySchool = $em->getRepository('PouceUserBundle:School');

        $school = $repositorySchool->find($schoolId);

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
                'teams'     => $teamIdArray,
                'school'    => $school
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
                'editionArray'  => $editionArray,
                'schoolId'      => $schoolId
            ));
    }
}
