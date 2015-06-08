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
  		// Check if the user have completed all his informations like first_name, last_name, telephone number ...
  		$isUserUpdated = (null != $this->getUser()->getFirstName());

  		//Check if the user have already a team for one of the next edition
  		$hasATeam = false;
  		//exit(\Doctrine\Common\Util\Debug::dump($isUserUpdated));

  		//On vérifie si la personne a déjà une équipe
  		if(!$hasATeam)
  		{
  			// On regarde si la deuxième partie de son profil est remplit
  			if(!$isUserUpdated)
	  		{
		  		$form = self::updateUser($request);
			}
			else{

				$form = self::addFormTeam($request);
				$user = $this->getUser();

			    // On passe la méthode createView() du formulaire à la vue
			    // afin qu'elle puisse afficher le formulaire toute seule
			    return $this->render('PouceTeamBundle:Team:addTeam.html.twig', array(
			      'teamForm' => $form->createView(),
			      'user' => $user,
			    ));
			}
  		}
  		else
  		{
  			return $this->render('PouceTeamBundle:Team:hasATeam.html.twig');
  		}
  		
	}

	/*
		Redirige le user vers le formulaire d'update d'user avec un message 
		pour lui expliquer qu'il faut metttre à jour ses données s'il veut s'inscrire 
	*/
	private function updateUser(Request $request)
	{
		$request->getSession()->getFlashBag()->add('updateInformations', 'Vous devez remplir votre profil pour vous inscrire');

		return $this->redirect($this->generateUrl('pouce_user_addinformations'));
	}

	/*
		Creer le formulaire de création d'équipe
	*/
	private function addFormTeam(Request $request)
	{
 		// On crée un objet Advert
	    $team = new Team();

	    // On crée le FormBuilder grâce au service form factory
	    $form = $this->get('form.factory')->create(new TeamType(), $team);

	    if ($request->getMethod() == 'POST') {
		    if ($form->handleRequest($request)->isValid()) {
		    	$user->getUser();
		    	$this->addUser($user); // A tester

				$em = $this->getDoctrine()->getManager();
				$em->flush();

				$request->getSession()->getFlashBag()->add('notice', 'Equipe bien enregistrée.');

				return $this->redirect('PouceSiteBundle:Site:index.html.twig');
		    }
		}

		return $form;
	}
}
