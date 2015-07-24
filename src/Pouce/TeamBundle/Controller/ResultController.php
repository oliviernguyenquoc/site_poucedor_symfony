<?php

namespace Pouce\TeamBundle\Controller;

use Pouce\TeamBundle\Entity\Comment;
use Pouce\TeamBundle\Entity\Result;
use Pouce\UserBundle\Entity\User;
use Pouce\TeamBundle\Entity\Position;
use Pouce\TeamBundle\Form\ResultType;
use Pouce\TeamBundle\Form\PositionType;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
// Add a use statement to be able to use the class
use Sioen\Converter;

class ResultController extends Controller
{
	public function addResultAction(Request $request)
	{

		$hasATeam = true; // TODO : Need to be replaced by a request
		$haveAResult = false; // TODO : Need to be replaced by a request
		$haveAComment = false; // TODO : Need to be replaced by a request

		//On vérifie si la personne a déjà une équipe
		if($hasATeam)
		{
			/* ***************************************************
				Creer le formulaire de destination
			*************************************************** */

			$user=$this->getUser();
			$repository = $this->getDoctrine()->getRepository('PouceTeamBundle:Team');
			$team=$repository->getLastTeam($user->getId());

			$result = new Result();
			// On crée le FormBuilder grâce au service form factory
			$form = $this->get('form.factory')->create(new ResultType(), $result);

			if ($form->handleRequest($request)->isValid()) {

				$em = $this->getDoctrine()->getManager();
				$result->setTeam($team);
				$result->getPosition()->setTeam($team);
				$result->getPosition()->setEdition($team->getEdition());
				$result->setEdition($team->getEdition());

				// Ajout d'un point dans la base de données et liaison résultat <-> Point
				$trajet = $this->container->get('pouce_team.trajet');
				$town=$form->get('position')->get('city')->getData();
				$country=$form->get('position')->get('country')->getData();
				$arrivee=$trajet->location($town,$country);
				$longArrivee=$arrivee[0]["lon"];
				$latArrivee=$arrivee[0]["lat"];

				//Calcule du trajet
				$distance=$trajet->calculDistance($user->getSchool()->getLongitude(),$user->getSchool()->getLatitude(),$longArrivee,$latArrivee);
				$result->getPosition()->setDistance($distance);
				$result->getPosition()->setLongitude($longArrivee);
				$result->getPosition()->setLatitude($latArrivee);

				//Enregistrement
				$em->persist($result);
				$em->flush();


				$request->getSession()->getFlashBag()->add('notice', 'Résultat bien enregistrée.');

				return $this->redirect($this->generateUrl('pouce_site_homepage'));
			}

			// On passe la méthode createView() du formulaire à la vue
			// afin qu'elle puisse afficher le formulaire toute seule
			return $this->render('PouceTeamBundle:Team:addResult.html.twig', array(
			  'resultForm' => $form->createView(),
			));
		}
		else
		{
			$request->getSession()->getFlashBag()->add('updateInformations', 'Vous devez remplir votre profil pour vous inscrire');
			exit(\Doctrine\Common\Util\Debug::dump($result));
			return $this->redirect($this->generateUrl('pouce_user_addinformations'));
		}
		
	}


	/*
		Creer le formulaire de commentaire sans la partie sur la destination (car déj)à remplit)
	*/
	public function createCommentAction(Request $request)
	{
		$comment= new Comment();

		// On crée le FormBuilder grâce au service form factory
		$formBuilder = $this->get('form.factory')->createBuilder('form', $comment);

		// On ajoute les champs de l'entité que l'on veut à notre formulaire
		$formBuilder
		  ->add('block',   'textarea', array(
				'attr'=> 	array(	'class'=>'js-st-instance',
									'name'=>'aventureForm'      			
							)
			))
		;
		// Pour l'instant, pas de candidatures, catégories, etc., on les gérera plus tard

		// À partir du formBuilder, on génère le formulaire
		$form = $formBuilder->getForm();

		if($request->getMethod() == 'POST'){
			$em = $this->getDoctrine()->getManager();
			$user=$this->getUser();
			$repository = $this->getDoctrine()->getRepository('PouceTeamBundle:Team');
			$team=$repository->getLastTeam($user->getId());
			$comment->setTeam($team);
			$comment->setBlock($_FILES);

			//Enregistrement
			// $em->persist($comment);
			// $em->flush();

			exit(\Doctrine\Common\Util\Debug::dump($request->isXmlHttpRequest()));

			//exit(\Doctrine\Common\Util\Debug::dump($_POST['aventureForm']));
		}
		return $this->render('PouceTeamBundle:Team:createComment.html.twig', array(
			'form'=>$form->createView(),
			));
	}

	/*
		Affiche juste la partie destination et commentaires (car déjà tout deux remplit)
	*/
	public function showResultAction($id)
	{
		$repositoryComment = $this
		  ->getDoctrine()
		  ->getManager()
		  ->getRepository('PouceTeamBundle:Comment')
		;

		$repositoryResult = $this
		  ->getDoctrine()
		  ->getManager()
		  ->getRepository('PouceTeamBundle:Result')
		;

		$comment = $repositoryComment->findOneByTeam($id);
		$result = $repositoryResult->findOneByTeam($id);

		// create a converter object and handle the input
		$converter = new Converter();
		$html = $converter->toHtml($comment->getBlock());

		return $this->render('PouceTeamBundle:Team:showResult.html.twig', array(
		  'html'	=> $html,
		  'result' 	=> $result
		));	
	}

	public function addPositionAction(Request $request)
	{
		$user=$this->getUser();
		$repository = $this->getDoctrine()->getRepository('PouceTeamBundle:Team');
		$team=$repository->getLastTeam($user->getId());

		$position= new Position();

		/// On crée le FormBuilder grâce au service form factory
		$form = $this->get('form.factory')->create(new PositionType(), $position);

		if ($form->handleRequest($request)->isValid()) {
			$em = $this->getDoctrine()->getManager();

			$position->setTeam($team);
			$position->setEdition($team->getEdition());

			// Ajout d'un point dans la base de données et liaison résultat <-> Point
			$trajet = $this->container->get('pouce_team.trajet');
			$town=$form->get('city')->getData();
			$country=$form->get('country')->getData();
			$arrivee=$trajet->location($town,$country);
			$longArrivee=$arrivee[0]["lon"];
			$latArrivee=$arrivee[0]["lat"];

			//Calcule du trajet
			$distance=$trajet->calculDistance($user->getSchool()->getLongitude(),$user->getSchool()->getLatitude(),$longArrivee,$latArrivee);
			$result->setDistance($distance);
			$result->setLongitude($longArrivee);
			$result->setLatitude($latArrivee);

			//Enregistrement
			$em->persist($comment);
			$em->flush();

			return $this->redirect($this->generateUrl('pouce_site_homepage'));
		}
		return $this->render('PouceTeamBundle:Team:addPosition.html.twig', array(
			'form'=>$form->createView(),
			));
	}

	/**
	*	Donne le résultat et propose de le modifier si besoin. 
	*	S'il n'y a pas encore de résultat rentré, cela met un lien vers le formulaire d'ajout de résultat
	*/
	public function mainPageResultsAction()
	{
		$user=$this->getUser();
		$repository = $this->getDoctrine()->getRepository('PouceTeamBundle:Team');
		$team=$repository->getLastTeam($user->getId());
		$result=$repository->getResult($team);

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

}
