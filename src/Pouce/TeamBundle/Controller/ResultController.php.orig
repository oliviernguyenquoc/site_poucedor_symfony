<?php

namespace Pouce\TeamBundle\Controller;

use Pouce\TeamBundle\Entity\Team;
use Pouce\UserBundle\Entity\User;
use Pouce\TeamBundle\Form\TeamType;
use Pouce\UserBundle\Form\UserType;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;

class TeamController extends Controller
{
	public function addResultAction(Request $request)
  	{

  		$hasATeam = true; // TODO : Need to be replaced by a request
  		$haveAResult = false; // TODO : Need to be replaced by a request
  		$haveAComment = false; // TODO : Need to be replaced by a request

  		//exit(\Doctrine\Common\Util\Debug::dump($isUserUpdated));

  		//On vérifie si la personne a déjà une équipe
  		if($hasATeam)
  		{
  			// On regarde si la deuxième partie de son profil est remplit
  			if($haveAResult)
	  		{
		  		$form = self::createResult($request);
			}
			else if($haveAComment){
				$form = self::createComment($request);
			}
			else {
				self::showResult($request);
			}
  		}
  		else
  		{
  			return $this->render('PouceTeamBundle:Team:hasATeam.html.twig');
  		}
  		
	}

	/*
		Creer le formulaire de destination et de commentaire
	*/
	private function createResult(Request $request)
	{
		// $request->getSession()->getFlashBag()->add('updateInformations', 'Vous devez remplir votre profil pour vous inscrire');

		// return $this->redirect($this->generateUrl('pouce_user_addinformations'));
	}

	/*
		Creer le formulaire de commentaire sans la partie sur la destination (car déj)à remplit)
	*/
	private function createComment(Request $request)
	{
 		// On crée un objet Advert
	    $team = new Team();

	    // On crée le FormBuilder grâce au service form factory
	    $form = $this->get('form.factory')->create(new TeamType(), $team);

	    if ($request->getMethod() == 'POST') {
		    if ($form->handleRequest($request)->isValid()) {
		      $em = $this->getDoctrine()->getManager();
		      $em->flush();

		      $request->getSession()->getFlashBag()->add('notice', 'Equipe bien enregistrée.');

		      return $this->redirect('PouceSiteBundle:Site:index.html.twig');
		    }
		}

		return $form;
	}

	/*
		Affiche juste la partie destination et commentaires (car déjà tout deux remplit)
	*/
	private function showResult(Request $request)
	{

	}
}
