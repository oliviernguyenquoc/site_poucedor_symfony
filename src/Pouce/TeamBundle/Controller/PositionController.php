<?php

namespace Pouce\TeamBundle\Controller;

use Pouce\TeamBundle\Entity\Comment;
use Pouce\TeamBundle\Entity\Result;
use Pouce\TeamBundle\Entity\Position;
use Pouce\TeamBundle\Entity\RecitImage;
use Pouce\TeamBundle\Form\ResultEditType;
use Pouce\TeamBundle\Form\PositionType;
use Pouce\TeamBundle\Form\PositionEditType;
use Pouce\TeamBundle\Form\PositionWithHourType;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Doctrine\ORM\NoResultException;
use Symfony\Component\Validator\Constraints\DateTime;

// Add a use statement to be able to use the class
use Sioen\Converter;

class PositionController extends Controller
{
	public function addPositionAction($editionId, Request $request)
	{ 
		$user = $this->getUser();

		$em = $this->getDoctrine()->getManager();
		$repository = $em->getRepository('PouceTeamBundle:Team');

		if($editionId==0)
		{
			$team = $repository->getLastTeam($user->getId())->getSingleResult();
		}
		else
		{
			$team = $repository->findOneTeamByEditionAndUsers($editionId, $user->getId())->getSingleResult();
		}

		$position = new Position();

		/// On crée le FormBuilder grâce au service form factory
		$form = $this->get('form.factory')->create(new PositionType(), $position);

		if ($request->isMethod('POST'))
		{
			$this->position($position, $user, $team, $request, 'PouceTeamBundle:Team:addPosition.html.twig');

			return $this->redirect($this->generateUrl('pouce_user_mainpage'));
		}
		return $this->render('PouceTeamBundle:Team:addPosition.html.twig', array(
			'form' => $form->createView()
			));
	}

	public function addPositionWithHourAction($editionId, Request $request)
	{ 
		$user = $this->getUser();

		$em = $this->getDoctrine()->getManager();
		$repositoryEdition = $em->getRepository('PouceSiteBundle:Edition');
		$repository = $em->getRepository('PouceTeamBundle:Team');

		if($editionId==0)
		{
			$team = $repository->getLastTeam($user->getId())->getSingleResult();
			$edition = $team->getEdition();
		}
		else
		{
			$edition = $repositoryEdition->find($editionId);
			$team = $repository->findOneTeamByEditionAndUsers($editionId, $user->getId())->getSingleResult();
		}

		$position = new Position();

		$position->setCreated($edition->getDateOfEvent());

		/// On crée le FormBuilder grâce au service form factory
		$form = $this->get('form.factory')->create(new PositionWithHourType(), $position);

		if ($request->isMethod('POST'))
		{
			$this->position($position, $user, $team, $request, 'PouceTeamBundle:Team:addPositionWithHour.html.twig', 'pouce_teambundle_position');

			return $this->redirect($this->generateUrl('pouce_team_position_show', array('editionId' => $editionId)));
		}
		return $this->render('PouceTeamBundle:Team:addPositionWithHour.html.twig', array(
			'form'		=>	$form->createView(),
			'editionId'	=>	$editionId
			));
	}

	public function editPositionAction($positionId, Request $request)
	{

		$user = $this->getUser();

		$em = $this->getDoctrine()->getManager();
		$repository = $em->getRepository('PouceTeamBundle:Team');
		$repositoryPosition = $em->getRepository('PouceTeamBundle:Position');

		$position = $repositoryPosition->find($positionId);

		$edition = $position->getTeam()->getEdition();
		$editionId = $edition->getId();
		$team = $repository->findOneTeamByEditionAndUsers($editionId, $user->getId())->getSingleResult();	

		/// On crée le FormBuilder grâce au service form factory
		$form = $this->get('form.factory')->create(new PositionEditType(), $position);

		if ($request->isMethod('POST')) 
		{
			$this->position($position, $user, $team, $request, 'PouceTeamBundle:Team:editPosition.html.twig', 'pouce_teambundle_positionEdit');

			return $this->redirect($this->generateUrl('pouce_team_position_show', array('editionId' => $editionId)));
		}
		return $this->render('PouceTeamBundle:Team:editPosition.html.twig', array(
			'form'		=> $form->createView(),
			'position' 	=> $position
			));
	}

	public function addPositionOfTeamAction($teamId, Request $request)
	{
		$user = $em->getRepository('PouceUserBundle:User')->findAUserOfTeam($team);

		$em = $this->getDoctrine()->getManager();
		$repository = $em->getRepository('PouceTeamBundle:Team');
		$team = $repository->find($teamId);

		$position= new Position();

		/// On crée le FormBuilder grâce au service form factory
		$form = $this->get('form.factory')->create(new PositionType(), $position);

		if ($request->isMethod('POST'))
		{
			position($position, $user, $team, $request, 'PouceTeamBundle:Team:addPositionSpecificTeam.html.twig');

			return $this->redirect($this->generateUrl('pouce_site_checkParticipants', array('editionId' => $team->getEdition()->getId() )));
		}
		return $this->render('PouceTeamBundle:Team:addPositionSpecificTeam.html.twig', array(
			'form'=>$form->createView(),
			'team' => $team
			));
	}

	private function position($position, $user, $team, $request, $adressForm, $adressRequest = NULL)
	{
		$position->setTeam($team);

		// Ajout d'un point dans la base de données et liaison résultat <-> Point
		$trajet = $this->container->get('pouce_team.trajet');
		$town = $request->request->get('fakeundefined');
		$country = $request->request->get('pays');

		$em = $this->getDoctrine()->getManager();
		$repositoryCity = $em->getRepository('PouceSiteBundle:City');
		$repositoryCountry = $em->getRepository('PouceSiteBundle:Country');
		$repositoryResult = $em->getRepository('PouceTeamBundle:Result');

		$pays = $repositoryCountry->findOneBy(
			array('name' => $country)
		);

		if($pays!=NULL)
		{
			$paysId = $pays->getId();

			$ville = $repositoryCity->findOneBy(
				array(
					'name' => $town,
					'country' => $paysId
					)
				);
			if($ville == NULL)
			{
				return $this->render($adressForm, array(
					'form' => $form->createView()
					));
			}
		}
		else
		{
			return $this->render($adressForm, array(
				'form' => $form->createView()
				));
		}

		$position->setCity($ville);

		//Change created date
		if($adressRequest != NULL)
		{
			$temp = $request->request->get($adressRequest);
			$date = new \DateTime($temp['created']['date']['day'].'-'.$temp['created']['date']['month'].'-'.date("Y").' '.$temp['created']['time']['hour'].':'.$temp['created']['time']['minute']);
			$position->setCreated($date);
		}		

		$longArrivee = $ville->getLongitude();
		$latArrivee = $ville->getLatitude();

		//Calcule du trajet
		$distance = $trajet->calculDistance($user->getSchool()->getCity()->getLongitude(),$user->getSchool()->getCity()->getLatitude(),$longArrivee,$latArrivee);

		$position->setDistance($distance);

		// On cherche le record de la team (pour l'instant) s'il existe
		$result = $repositoryResult->findOneBy(
			array(
				'team' => $team->getId()
				)
			);

		if($result==NULL)
		{
			$result = new Result();
			$result->setTeam($team);
			$result->setPosition($position);
			$result->setLateness(0);
			$result->setIsValid(false);
			$result->setRank(0);
		}
		else
		{
			$previousDistance = $result->getPosition()->getDistance();

			//On regarde si le record à été battu. Si oui, on enregistre le nouveau record
			if($previousDistance < $distance)
			{
				//S'il est battu on le remplace
				$result->setPosition($position);
			}
		}

		//Enregistrement
		$em->persist($position);
		$em->persist($result);
		$em->flush();

		return true;
	}

	public function deletePositionAction($positionId)
	{
		$em = $this->getDoctrine()->getManager();
		$repositoryPosition = $em->getRepository('PouceTeamBundle:Position');

		$position = $repositoryPosition->find($positionId);

		$editionId = $position->getTeam()->getEdition()->getId();

		$em->remove($position);
		$em->flush();

		return $this->redirect($this->generateUrl('pouce_team_position_show', array('editionId' => $editionId)));
	
	}

	public function showPositionsAction($editionId)
	{
		$user = $this->getUser();
		$em = $this->getDoctrine()->getManager();

		$repositoryPosition = $em->getRepository('PouceTeamBundle:Position');
		$repositoryTeam = $em->getRepository('PouceTeamBundle:Team');
		$repositoryUser = $em->getRepository('PouceUserBundle:User');

		$team = $repositoryTeam->findOneTeamByEditionAndUsers($editionId, $user->getId())->getSingleResult();

		$positions = $repositoryPosition->findAllPositionsByTeamAndEdition($team->getId(), $editionId);
		$school = $repositoryUser->findAUserOfTeam($team)->getSchool();

		return $this->render('PouceTeamBundle:Team:showPositions.html.twig', array(
			'positions' => $positions,
			'school' => $school,
			'edition' => $editionId
			));
	}

	public function searchCityAction(Request $request)
	{
		$q = $request->get('term');
		$em = $this->getDoctrine()->getManager();
		$cities = $em->getRepository('PouceSiteBundle:City')->findLikeName($q);
		$results = array();
		foreach ($cities as $city) {
			$results[] = array(
				'id' => $city->getId(),
				'name' => $city->getName(),
				'label' => sprintf("%s", $city->getName())
			);
		}

		return new JsonResponse($results);
	}

	public function getCityAction($id)
	{
		$em = $this->getDoctrine()->getManager();
		$city = $em->getRepository('PouceSiteBundle:City')->find($id);

		return new Response($city->getName());
	}

	public function getCountryAction($cityName)
	{
		$em = $this->getDoctrine()->getManager();
		$city = $em->getRepository('PouceSiteBundle:City')->findOneByName($cityName);

		return new Response($city->getCountry()->getName());
	}
}
