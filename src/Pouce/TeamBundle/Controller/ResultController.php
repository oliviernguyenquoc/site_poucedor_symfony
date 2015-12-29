<?php

namespace Pouce\TeamBundle\Controller;

use Pouce\TeamBundle\Form\ResultEditType;
use Pouce\TeamBundle\Form\Type\ResultAdminType;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Doctrine\ORM\NoResultException;

// Add a use statement to be able to use the class
use Sioen\Converter;

class ResultController extends Controller
{
	/**
	*	Ajoute un résultat (Une position, une équipe, une édition, un rang...)
	*/
	public function addResultAction($editionId, Request $request)
	{
		$em = $this->getDoctrine()->getManager();
		$repository = $em->getRepository('PouceTeamBundle:Team');
		$user = $this->getUser();

		//Flag
		$hasATeam = true;

		try{
			$repository->findOneTeamByEditionAndUsers($editionId, $user->getId())->getSingleResult();
		}
		catch(NoResultException $e)
		{
			$hasATeam = false;
		}
		
		//On vérifie si la personne a déjà une équipe
		if($hasATeam)
		{
			/* ***************************************************
					Ajout d'une position
			*************************************************** */

			return $this->redirect($this->generateUrl('pouce_position_add', array('editionId' => $editionId)));

		}
		else
		{
			return $this->redirect($this->generateUrl('pouce_user_mainpage'));
		}
		
	}

	// TODO : Need to be retested
	public function editResultAction($editionId, Request $request)
	{
		$em = $this->getDoctrine()->getManager();
		$repositoryTeam = $em->getRepository('PouceTeamBundle:Team');
		
		$user = $this->getUser();
		$team = $repositoryTeam->findOneTeamByEditionAndUsers($editionId, $user->getId())->getSingleResult(); 

		/* ***************************************************
				Creer le formulaire de destination
		*************************************************** */

		$result = $em->getRepository('PouceTeamBundle:Result')->findOneByTeam($team);

		/// On crée le FormBuilder grâce au service form factory
		$form = $this->get('form.factory')->create(new ResultEditType(), $result);

		if ($form->handleRequest($request)->isValid())
		{
			//Enregistrement
			$em->persist($result);
			$em->flush();

			$request->getSession()->getFlashBag()->add('notice', 'Résultat bien enregistrée.');

			return $this->redirect($this->generateUrl('pouce_user_mainpage'));
		}

		// On passe la méthode createView() du formulaire à la vue
		// afin qu'elle puisse afficher le formulaire toute seule
		return $this->render('PouceTeamBundle:Team:editResult.html.twig', array(
		  'resultForm' => $form->createView(),
		  'result' => $result
		));
	}

	/*
		Affiche juste la partie destination et commentaires (car déjà tout deux remplit)
		id : id of team
	*/
	public function showResultAction($id)
	{
		$em = $this->getDoctrine()->getManager();

		$repositoryPosition = $em->getRepository('PouceTeamBundle:Position');
		$repositoryResult = $em->getRepository('PouceTeamBundle:Result');
		$repositoryUser = $em->getRepository('PouceUserBundle:User');
		$repositoryTeam = $em->getRepository('PouceTeamBundle:Team');


		$team = $repositoryTeam->find($id);
		$edition = $team->getEdition();

		$positions = $repositoryPosition->findAllPositionsByTeamAndEdition($id, $edition->getId());
		$school = $repositoryUser->findAUserOfTeam($team)->getSchool();

		$result = $repositoryResult->findOneByTeam($id);
		$comment = $result->getComment();

		// create a converter object and handle the input
		$converter = new Converter();
		if($comment!=NULL){
			$html = $converter->toHtml($comment->getBlock());			
		}
		else{
			$html = NULL;
		}

		return $this->render('PouceTeamBundle:Team:showResult.html.twig', array(
		  'html'	=> $html,
		  'result' 	=> $result,
		  'edition' => $edition,
		  'positions' => $positions,
		  'school' => $school,
		  'team' => $team
		));	
	}

	/**
	*	Donne le résultat et propose de le modifier si besoin. 
	*	S'il n'y a pas encore de résultat rentré, cela met un lien vers le formulaire d'ajout de résultat
	*/
	public function mainPageResultsAction()
	{
		$user = $this->getUser();
		$em = $this->getDoctrine()->getManager();
		$repository = $em->getRepository('PouceTeamBundle:Team');
		$resultRepo = $em->getRepository('PouceTeamBundle:Result');
		$team = $repository->getLastTeam($user->getId())->getSingleResult();
		$result = $resultRepo->getResultTeam($team)->getSingleResult();

		// On récupère le service
		$resultService = $this->container->get('pouce_team.team');

		if($resultService->isResultSet($team))
		{
			if($resultService->isResultSetCompletely($team))
			{
				return $this->render('PouceUserBundle:User:showResults.html.twig', array(
					'team'		=> $team,
					'result'	=> $result
				));
			}
			else
			{
				return $this->render('PouceUserBundle:User:showResultsAndLinkToCompleteResults.html.twig', array(
					'team'		=> $team,
					'result'	=> $result
				));
			}
		}
		else
		{
			return $this->render('PouceUserBundle:User:linkToAddResults.html.twig');
		}
	}

	/**
	*	Recalcul toute les distance par rapport aux résultats entrées
	*/
	public function recalculAction($editionId)
	{
		$repository = $this->getDoctrine()->getManager();
		$repositoryResult = $repository->getRepository('PouceTeamBundle:Result');
		$repositoryUser = $repository->getRepository('PouceUserBundle:User');
		$trajet = $this->container->get('pouce_team.trajet');

		$resultArray = $repositoryResult->getAllResultsInEdition($editionId);
		
		foreach($resultArray as $key=>$result)
		{
			$team = $result->getTeam();
			$user = $repositoryUser->findAUserOfTeam($team);

			$position =  $result->getPosition();

			$longArrivee = $position->getCity()->getLongitude();
			$latArrivee = $position->getCity()->getLatitude();

			//Calcule du trajet
			$distance=$trajet->calculDistance($user->getSchool()->getCity()->getLongitude(),$user->getSchool()->getCity()->getLatitude(),$longArrivee,$latArrivee);

			$position->setDistance($distance);
			$repository->flush();
		}

		return $this->redirectToRoute('pouce_site_homepage');
	}

	public function editResultAdminAction($teamId, Request $request)
	{
		$em = $this->getDoctrine()->getManager();
		$repositoryTeam = $em->getRepository('PouceTeamBundle:Team');
		$repositoryResult = $em->getRepository('PouceTeamBundle:Result');
		
		$team = $repositoryTeam->find($teamId);

		$result = $repositoryResult->findOneByTeam($teamId);

		// On crée le FormBuilder grâce au service form factory
		$form = $this->get('form.factory')->create(new ResultAdminType(), $result);

		if ($form->handleRequest($request)->isValid())
		{
			//Enregistrement
			$em->persist($result);
			$em->flush();

			$request->getSession()->getFlashBag()->add('notice', 'Résultat bien enregistrée.');

			return $this->redirect($this->generateUrl('pouce_user_mainpage'));
		}

		// On passe la méthode createView() du formulaire à la vue
		// afin qu'elle puisse afficher le formulaire toute seule
		return $this->render('PouceSuperAdminBundle:Admin:editResultAdmin.html.twig', array(
		  'resultForm' 	=> $form->createView(),
		  'result' 		=> $result,
		  'teamId'		=> $teamId
		));
	}

}
