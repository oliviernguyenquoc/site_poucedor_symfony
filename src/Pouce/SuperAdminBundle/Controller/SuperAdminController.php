<?php

namespace Pouce\SuperAdminBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

use Pouce\SiteBundle\Entity\Edition;

use Pouce\SuperAdminBundle\Form\Type\EditionType;
use Pouce\SuperAdminBundle\Form\Type\EditionEditType;

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

    public function addEditionAction(Request $request)
    {
    	$edition = new Edition();

        // On crée le FormBuilder grâce au service form factory
        $form = $this->get('form.factory')->create(new EditionType());

        if ($request->getMethod() == 'POST') {
			if ($form->handleRequest($request)->isValid()) {

				$em = $this->getDoctrine()->getManager();

				$edition->setStatus("scheduled");
				
				$em->persist($edition);
				$em->flush();
				
				return $this->redirect($this->generateUrl('pouce_user_mainpage'));
			}
		}

        // On passe la méthode createView() du formulaire à la vue
		// afin qu'elle puisse afficher le formulaire toute seule
		return $this->render('PouceSuperAdminBundle:Admin:addEdition.html.twig', array(
		  'form' => $form->createView()
		));
    }
}
