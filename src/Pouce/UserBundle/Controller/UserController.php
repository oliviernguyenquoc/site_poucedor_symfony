<?php

namespace Pouce\UserBundle\Controller;

use Pouce\UserBundle\Entity\User;
use Pouce\UserBundle\Form\UserType;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;

class UserController extends Controller
{
	public function addInformationsAction()
  	{
  		$request = $this->getRequest();

    	//On récupère le User en cours
  		$user = $this->getUser();

	    // On crée le FormBuilder grâce au service form factory
	    $form = $this->get('form.factory')->create(new UserType());

	    if ($request->getMethod() == 'POST') {
		    if ($form->handleRequest($request)->isValid()) {
				$informations = $form->getData();

				//On récupère les informations du form et on update le User
				//Méthode un peu spécial à cause de l'utilisation du bundle FOSUserBundle
				$user->setFirstName($informations->getFirstName());
				$user->setLastName($informations->getLastName());
				$user->setSex($informations->getSex());
				$user->setPromotion($informations->getPromotion());
				$user->setTelephone($informations->getTelephone());			

				$userManager = $this->container->get('fos_user.user_manager');
				$userManager->updateUser($user);

		        $request->getSession()->getFlashBag()->add('updateInformations', 'Utilisateur mis à jour');

				return $this->redirect($this->generateUrl('pouce_site_homepage'));
			}
		}

	    // On passe la méthode createView() du formulaire à la vue
	    // afin qu'elle puisse afficher le formulaire toute seule
	    return $this->render('PouceUserBundle:Registration:updateInformations.html.twig', array(
			      'updateForm' => $form->createView(),
			    ));
	 }

	public function getDefaultOptions()
	{
	    return array(
	        'validation_groups' => array('updateRegistration')
	    );
	}

	public function showMainPageAction()
	{
		$user=$this->getUser();
		
		return $this->render('PouceUserBundle:User:mainpage.html.twig', array(
	    	'user' 	=> $user
	    ));

	}

	public function informationsAction()
  	{
  		$user=$this->getUser();
  		$isUserUpdated= self::checkUserAdditionnalInformations($user);

  		if($isUserUpdated)
  		{
  			return $this->render('PouceUserBundle:User:informationsUser.html.twig', array(
		    	'user' 	=> $user
		    ));
  		}
  		else
  		{
  			return $this->render('PouceUserBundle:User:informationsRequest.html.twig', array(
		    	'user' 	=> $user
		    ));
  		}
  	}

	public function checkUserAdditionnalInformations($user)
	{
		$isUserUpdated =	(null != $user->getFirstName()) &&
							(null != $user->getLastName()) &&
							(null != $user->getSex()) &&
							(null != $user->getPromotion()) &&
							(null != $user->getTelephone());

		return $isUserUpdated;
	}

}
