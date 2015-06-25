<?php

namespace Pouce\TeamBundle\Controller;

use Pouce\TeamBundle\Entity\Result;
use Pouce\UserBundle\Entity\User;
use Pouce\TeamBundle\Form\ResultType;
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
			/* ***************************************************
				Creer le formulaire de destination
			*************************************************** */

		  	$user=$this->getUser();
		  	$repository = $this->getDoctrine()->getRepository('Pouce:UserBundle:User');
		  	$team=$repository->getLastTeam($user->getId());

			// On crée le FormBuilder grâce au service form factory
		    $form = $this->get('form.factory')->create(new ResultType($team));

		    if ($request->getMethod() == 'POST') {
			    if ($form->handleRequest($request)->isValid()) {

					$em = $this->getDoctrine()->getManager();

					$em->flush();

					$request->getSession()->getFlashBag()->add('notice', 'Résultat bien enregistrée.');

					return $this->redirect($this->generateUrl('pouce_site_homepage'));
				}
			}

			$user = $this->getUser();

		    // On passe la méthode createView() du formulaire à la vue
		    // afin qu'elle puisse afficher le formulaire toute seule
		    return $this->render('PouceTeamBundle:Team:addResult.html.twig', array(
		      'resultForm' => $form->createView(),
		    ));
  		}
  		else
  		{
  			$request->getSession()->getFlashBag()->add('updateInformations', 'Vous devez remplir votre profil pour vous inscrire');

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
