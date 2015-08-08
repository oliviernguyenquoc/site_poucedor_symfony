<?php

namespace Pouce\UserBundle\Controller;

use Pouce\UserBundle\Entity\User;
use Pouce\UserBundle\Form\UserType;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Doctrine\ORM\NoResultException;

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

	public function organisationPageAction()
    {
        $user=$this->getUser();
        $schoolId=$user->getSchool()->getId();

        $repository = $this->getDoctrine()->getManager();
			
		$repositoryUser = $repository->getRepository('PouceUserBundle:User');
		$repositoryEdition = $repository->getRepository('PouceSiteBundle:Edition');
		$repositoryTeam = $repository->getRepository('PouceTeamBundle:Team');
		$repositoryPosition = $repository->getRepository('PouceTeamBundle:Position');

		$editionId=$repositoryEdition->findCurrentEditionBySchool($schoolId)->getId();

		$userArray=$repositoryUser->findAllUsersBySchool($schoolId,$editionId);

		foreach($userArray as $key=>$user)
		{
			$userIdArray[$key][0]=$userArray[$key];
			$userIdArray[$key][1]=null;
		}

		$teamArray=$repositoryTeam->findAllTeamsByEditionByUsers($userArray,$editionId);

		foreach($teamArray as $key=>$team)
		{
			try
			{
				$userIdArray[$key][1]=$repositoryPosition->findLastPosition($team->getId())->getSingleResult();
			}
			catch(NoResultException $e)
			{
				$userIdArray[$key][1]=null;
			}
		}

        return $this->render('PouceUserBundle:Organisation:checkParticipants.html.twig', array(
        		'teams'	=> $userIdArray
        	));
    }

}
