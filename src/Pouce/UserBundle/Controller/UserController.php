<?php

namespace Pouce\UserBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

use Pouce\UserBundle\Form\UserType;
use Pouce\UserBundle\Form\UserEditType;

class UserController extends Controller
{
	/**
	*	Page qui demande à l'utilisateur de complèter son profil
	*/
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

				return $this->redirect($this->generateUrl('pouce_user_mainpage'));
			}
		}

		// On passe la méthode createView() du formulaire à la vue
		// afin qu'elle puisse afficher le formulaire toute seule
		return $this->render('PouceUserBundle:Registration:updateInformations.html.twig', array(
				  'updateForm' => $form->createView(),
				));
	 }

	public function informationsAction()
	{
		$user=$this->getUser();
		$userService = $this->container->get('pouce_user.user');
		$isUserUpdated = $userService->checkUserAdditionnalInformations($user);

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

	/**
	*	Gère l'upload de l'image de profil d'user
	*/
	public function uploadImageProfilAction(Request $request)
	{
		$user = $this->getUser();
		$data = $request->files->get("uploadfile");

		$user->setImageFile($data);

		$userManager = $this->container->get('fos_user.user_manager');
		$userManager -> updateUser($user);

		return new Response(json_encode(array('success' => true, 'file' => $user->getImageName())));

	}

	/**
	*	Pour modifier les informations d'un user
	*/
	public function editUserAction($id, Request $request)
	{
		$em = $this->getDoctrine()->getManager();

		$user = $em ->getRepository('PouceUserBundle:User')->find($id);


		$form = $this->get('form.factory')->create(new UserEditType(), $user);

		if($request->getMethod() == 'POST') {
			$form->bind($request);

			if($form->isValid()){
				//On enregistre la team
				$userManager = $this->container->get('fos_user.user_manager');
				$userManager -> updateUser($user);

				return $this->redirect($this->generateUrl('pouce_user_mainpage'));
			}
		}
		return $this->render('PouceUserBundle:User:editUser.html.twig', array(
				  'form' 			=> $form->createView(),
				  'photoFileName' 	=> $user->getImageName(),
				  'id' 				=> $id
				));
	}

	/**
	*	Mettre le role de chef pouceux à quelqu'un
	*/
	public function setRoleChefPouceuxAction($userId)
	{
		$em = $this->getDoctrine()->getManager();
		$user = $em->getRepository('PouceUserBundle:User')->find($userId);

		//Set the admin role
		$user->addRole("ROLE_CHEFPOUCEUX");
		//Save it to the database
		$em->persist($user);
		$em->flush();

		return $this->redirect($this->generateUrl('pouce_site_config'));
	}

	/**
	*	Enlever le role de chef pouceux à quelqu'un
	*/
	public function removeRoleChefPouceuxAction($userId)
	{
		$em = $this->getDoctrine()->getManager();
		$user = $em->getRepository('PouceUserBundle:User')->find($userId);

		//Set the admin role
		 $user->removeRole('ROLE_CHEFPOUCEUX');
		//Save it to the database
		$em->persist($user);
		$em->flush();

		return $this->redirect($this->generateUrl('pouce_site_config'));
	}

}
