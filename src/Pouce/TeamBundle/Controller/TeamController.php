<?php

namespace Pouce\TeamBundle\Controller;

use Pouce\TeamBundle\Entity\Team;
use Pouce\UserBundle\Entity\User;
use Pouce\TeamBundle\Entity\Position;
use Pouce\TeamBundle\Form\PositionType;
use Pouce\TeamBundle\Form\TeamType;
use Pouce\TeamBundle\Form\TeamEditType;
use Pouce\UserBundle\Form\UserType;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;

class TeamController extends Controller
{
	public function addTeamAction(Request $request)
	{
		$user = $this->getUser();

		// Check if the user have completed all his informations like first_name, last_name, telephone number ...
		$isUserUpdated = (null !== $this->getUser()->getFirstName());

		//Check if the user have already a team for one of the next edition
		$teamService = $this->container->get('pouce_team.team');
		$hasATeam = $teamService->isRegisterToNextRaceOfItsSchool($user);

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

						$team->addUser($user);
						$team->setFinishRegister(false);

						$em = $this->getDoctrine()->getManager();
						$edition = $em -> getRepository('PouceSiteBundle:Edition')->findNextEditionByUserSchool($user)->getSingleResult();

						$team->setEdition($edition);

						$em = $this->getDoctrine()->getManager();
						$em->persist($team);
						$em->merge($user);
						$em->flush();

						$request->getSession()->getFlashBag()->add('notice', 'Equipe bien enregistrée.');

						return $this->redirect($this->generateUrl('pouce_user_mainpage'));
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

	/**
	*	Pour modifier les informations d'une équipe
	*/
	public function editTeamAction($id, Request $request)
	{
		$em = $this->getDoctrine()->getManager();
		$team = $em ->getRepository('PouceTeamBundle:Team')->find($id);

		//Des variables pour le formType
		$user = $this->getUser();

		$school =$user->getSchool();

		$form = $this->get('form.factory')->create(new TeamEditType($school,$user), $team);

		if($request->getMethod() == 'POST') {
			$form->bind($request);

			if($form->isValid()){
				//On enregistre la team
				$em->persist($team);
				$em->flush();

				return $this->redirect($this->generateUrl('pouce_user_mainpage'));
			}
		}
		return $this->render('PouceTeamBundle:Team:editTeam.html.twig', array(
				  'teamForm'=>$form->createView(),
				  'user' 	=> $user,
				  'id' 		=> $id
				));
	}

	/**
	*	Pour supprimer une équipe
	*
	*/
	public function deleteTeamAction($id, Request $request)
	{
		$em = $this->getDoctrine()->getManager();
		$team = $em ->getRepository('PouceTeamBundle:Team')->find($id);
		$user = $this->getUser();

		$teamService = $this->container->get('pouce_team.team');
		$isUserInTeam = $teamService->isATeamOfUser($team,$user);

		if($isUserInTeam)
		{
			$em->remove($team);
			$em->flush();
		}

		return $this->render('PouceUserBundle:User:messageAnouncementNextEdition.html.twig', array(
					'edition' => $edition));
	}

	/**
	*	Le but de cette focntion est de proposer de s'inscrire à la prochaine course si il y a, 
	*	d'afficher l'équipe dans lequel il est inscrit 
	*	ou de proposer de rentrer une position si une édition est en cours dans laquelle le user est inscrit.
	*/
	public function adaptativeViewAction()
	{
		$user = $this->getUser();

		// On récupère le service
    	$teamService = $this->container->get('pouce_team.team');
    	$isThereNextRace = $teamService->isThereNextRace($user);
		
		//Import User Controller logic
		// On récupère le service
    	$userService = $this->container->get('pouce_user.user');
		$isUserUpdated = $userService->checkUserAdditionnalInformations($user);

		// On regarde s'il existe une prochaine édition en cours d'inscrition ou juste prévu
		if($isThereNextRace)
		{
			// On cherche la prochaine edition
			$em = $this->getDoctrine()->getManager();
			$edition = $em->getRepository('PouceSiteBundle:Edition')->findNextEditionByUserSchool($user)->getSingleResult();

			$raceStatus=$edition->getStatus();

			// On regarde si la prochaine est dans sa phase inscription
			if($raceStatus=="registering")
			{
				// On regarde si le user est inscrit dans une équipe à cette course
				if($teamService->isRegisterToNextRaceOfItsSchool($user))
				{					
					$nextRaceTeam = $em->getRepository('PouceTeamBundle:Team')->findNextRaceTeam($user->getId());

					$user2 = $em->getRepository('PouceUserBundle:User')->findOtherUserInTeam($user,$nextRaceTeam);
					
					return $this->render('PouceUserBundle:User:teamInformations.html.twig', array(
						'user1' => $user,
						'user2' => $user2, // Le coéquipier
						'team' => $nextRaceTeam
						));
				}
				else
				{
					return $this->render('PouceUserBundle:User:linkToAddTeam.html.twig');
				}
			}
			//La prochaine édition est prévu
			else if($raceStatus=="scheduled")
			{
				return $this->render('PouceUserBundle:User:messageAnouncementNextEdition.html.twig', array(
					'edition' => $edition));
			}
			else
			{
				throw new Exception("Error : Race status not handled", 1);
			}
		}
		else
		{
			//On récupère le statut de la course (In progress, registering ...)
			$em = $this->getDoctrine()->getManager();
			$edition = $em->getRepository('PouceSiteBundle:Edition')->findPreviousEditionByUserSchool($user);

			$raceStatus=$edition->getStatus();


			// On regarde si le user a participer a au moins 1 édition et que cette édition est en train de se dérouller
			if(($teamService->isRegisterToPreviousRace($user)) && $raceStatus=="in progress")
			{
				// Edition in progress. On propose d'entrer sa position

				$user = $this->getUser();
				$repository = $this->getDoctrine()->getRepository('PouceTeamBundle:Team');
				$team = $repository->getLastTeam($user->getId())->getSingleResult();

				$position= new Position();

				// On crée le FormBuilder grâce au service form factory
				$form = $this->get('form.factory')->create(new PositionType(), $position);

				// Donne la dernière position et propose d'en ajouter une
				return $this->render('PouceTeamBundle:Team:addPositionBlock.html.twig', array(
					'form'=>$form->createView()
					));
			}
			// Il n'y a pas de prochaine édition et le user n'a jamais participer. On lui demande de rester au courrant pour la prochaine édition
			else
			{
				return $this->render('PouceUserBundle:User:messageWaitingNextRace.html.twig');
			}
		}
	}

	public function previousRaceAction()
	{
		return $this->render('PouceUserBundle:User:informationsRequest.html.twig');
	}

}
