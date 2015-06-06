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
	public function addTeamAction(Request $request)
  	{

  		$isUserUpdated = (null != $this->getUser()->getFirstName());
  		$hasATeam = false;
  		//exit(\Doctrine\Common\Util\Debug::dump($isUserUpdated));

  		//On vérifie si la personne a déjà une équipe
  		if(!$hasATeam)
  		{
  			// On regarde si la deuxième partie de son profil est remplit
  			if(!$isUserUpdated)
	  		{

		  		$form = self::updateUser($request);

			    // On passe la méthode createView() du formulaire à la vue
			    // afin qu'elle puisse afficher le formulaire toute seule
			    return $this->render('PouceTeamBundle:User:update.html.twig', array(
			      'teamForm' => $form->createView(),
			    ));
			}
			else{

				$form = self::addFormTeamWithoutUpdateUser($request);

			    // On passe la méthode createView() du formulaire à la vue
			    // afin qu'elle puisse afficher le formulaire toute seule
			    return $this->render('PouceTeamBundle:Team:addTeamWithoutUpdateUser.html.twig', array(
			      'teamForm' => $form->createView(),
			    ));
			}
  		}
  		else
  		{
  			return $this->render('PouceTeamBundle:Team:hasATeam.html.twig');
  		}
  		
	 }

	 /*
		Appel le formulaire de création de team 
		avec le formulaire d'update d'user
	 */
	 private function updateUser(Request $request)
	 {
	 		//On récupère le User en cours
	  		$user = $this->getUser();

		    // On crée le FormBuilder grâce au service form factory
		    $form = $this->get('form.factory')->create(new UserType(), $team);

		    if ($request->getMethod() == 'POST') {
			    if ($form->handleRequest($request)->isValid()) {
			      $em = $this->getDoctrine()->getManager();
			      $em->persist($user);
			      $em->flush();

			      $request->getSession()->getFlashBag()->add('notice', 'Equipe bien enregistrée.');

			      return $this->redirect('PouceSiteBundle:Site:index.html.twig');
			    }
			}

			return $form;
	 }

	 private function addFormTeamWithoutUpdateUser(Request $request)
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
}
