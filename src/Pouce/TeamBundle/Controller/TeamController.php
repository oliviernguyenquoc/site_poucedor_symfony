<?php

namespace Pouce\TeamBundle\Controller;

use Pouce\TeamBundle\Entity\Team;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;

class TeamController extends Controller
{
	public function addTeamAction(Request $request)
  	{

  		$isUserUpdated = (null != $this->getUser()->getFirstName());
  		//exit(\Doctrine\Common\Util\Debug::dump($isUserUpdated));

	  		if($isUserUpdated)
	  		{

	  		//On récupère le User en cours
	  		$user = $this->getUser();

		    // On crée un objet Advert
		    $team = new Team();

		    // On crée le FormBuilder grâce au service form factory
		    $form = $this->get('form.factory')->create(new TeamType(), $team);

		    if ($request->getMethod() == 'POST') {
			    if ($form->handleRequest($request)->isValid()) {
			      $em = $this->getDoctrine()->getManager();
			      $em->persist($user);
			      $em->flush();

			      $request->getSession()->getFlashBag()->add('notice', 'Equipe bien enregistrée.');

			      return $this->redirect('PouceSiteBundle:Site:index.html.twig');
			    }
			}

		    // On passe la méthode createView() du formulaire à la vue
		    // afin qu'elle puisse afficher le formulaire toute seule
		    return $this->render('PouceTeamBundle:Team:addTeamAndUpdateUser.html.twig', array(
		      'teamForm' => $form->createView(),
		    ));
		}
		else{
			return $this->render('PouceSiteBundle:Site:index.html.twig');
		}
	 }
}
