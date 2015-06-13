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
		  		$request->getSession()->getFlashBag()->add('updateInformations', 'Vous devez remplir votre profil pour vous inscrire');

				return $this->redirect($this->generateUrl('pouce_user_addinformations'));
			}
			else{

				// On crée un objet Team
			    $team = new Team();

			    //Des variables pour le formType
			    $user = $this->getUser();

		        $school =$user->getSchool();

			    // On crée le FormBuilder grâce au service form factory
			    $form = $this->get('form.factory')->create(new TeamType($school,$user), $team);

			    if ($request->getMethod() == 'POST') {
				    if ($form->handleRequest($request)->isValid()) {

				    	$team->addUser($user); // A tester
				    	$user->addTeam

						$em = $this->getDoctrine()->getManager();
						$em->flush();

						$request->getSession()->getFlashBag()->add('notice', 'Equipe bien enregistrée.');

						return $this->redirect($this->generateUrl('pouce_site_homepage'));
				    }
				}

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
  		return $this->redirect('PouceSiteBundle:Site:index.html.twig');
	}


}
