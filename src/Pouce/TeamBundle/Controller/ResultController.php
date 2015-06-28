<?php

namespace Pouce\TeamBundle\Controller;

use Pouce\TeamBundle\Entity\Result;
use Pouce\UserBundle\Entity\User;
use Pouce\TeamBundle\Form\ResultType;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;

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
				$result->setTeam($team);


				$em->persist($result);
				//$em->flush();

				// Ajout d'un point dans la base de données et liasion résultat <-> Point
    			$trajet = $this->container->get('pouce_team.trajet');
    			$town=$form->get('position')->get('town')->getData();
    			$country=$form->get('position')->get('country')->getData();
    			$arrivee=$trajet->location($town,$country);
    			$longArrivee=$arrivee[0]["lon"];
    			$latArrivee=$arrivee[0]["lat"];

				//Calcule du trajet
    			$distance=$trajet->calculDistance($user->getSchool()->getLongitude(),$user->getSchool()->getLatitude(),$longArrivee,$latArrivee);
    			
    			exit(\Doctrine\Common\Util\Debug::dump($distance));

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

	    // On crée le FormBuilder grâce au service form factory
	    $form = $this->get('form.factory')->create(new CommentType());

	    if ($request->getMethod() == 'POST') {
		    if ($form->handleRequest($request)->isValid()) {
		      $em = $this->getDoctrine()->getManager();
		      $em->flush();

		      $request->getSession()->getFlashBag()->add('notice', 'Equipe bien enregistrée.');

		      	    return $this->render('PouceTeamBundle:Team:addComment.html.twig', array(
				      'resultForm' => $form->createView(),
				    ));
		    }
		}

		return $form;
	}

	/*
		Affiche juste la partie destination et commentaires (car déjà tout deux remplit)
	*/
	public function showResultAction(Request $request)
	{
  	    return $this->render('PouceTeamBundle:Team:showResult.html.twig', array(
	      'result' => $result,
	    ));	}
}
