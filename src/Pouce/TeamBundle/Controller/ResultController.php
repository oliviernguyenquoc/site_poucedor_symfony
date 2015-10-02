<?php

namespace Pouce\TeamBundle\Controller;

use Pouce\TeamBundle\Entity\Comment;
use Pouce\TeamBundle\Entity\Result;
use Pouce\UserBundle\Entity\User;
use Pouce\TeamBundle\Entity\Position;
use Pouce\TeamBundle\Entity\RecitImage;
use Pouce\TeamBundle\Form\ResultType;
use Pouce\TeamBundle\Form\PositionType;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Doctrine\ORM\NoResultException;
// Add a use statement to be able to use the class
use Sioen\Converter;

class ResultController extends Controller
{
	/**
	*	Ajoute un résultat (Une position, une équipe, une édition, un rang...)
	*/
	public function addResultAction(Request $request)
	{

		$hasATeam = true; // TODO : Need to be replaced by a request
		$haveAResult = false; // TODO : Need to be replaced by a request
		$haveAComment = false; // TODO : Need to be replaced by a request

		//On vérifie si la personne a déjà une équipe
		if($hasATeam)
		{
			/* ***************************************************
				Creer le formulaire de destination
			*************************************************** */

			$user=$this->getUser();
			$repository = $this->getDoctrine()->getRepository('PouceTeamBundle:Team');
			$team=$repository->getLastTeam($user->getId())->getSingleResult();

			$result = new Result();
			// On crée le FormBuilder grâce au service form factory
			$form = $this->get('form.factory')->create(new ResultType(), $result);

			if ($form->handleRequest($request)->isValid()) {

				$em = $this->getDoctrine()->getManager();
				$result->setTeam($team);
				$result->getPosition()->setTeam($team);
				$result->getPosition()->setEdition($team->getEdition());
				$result->setEdition($team->getEdition());

				// Ajout d'un point dans la base de données et liaison résultat <-> Point
				$trajet = $this->container->get('pouce_team.trajet');
				$town = $form->get('position')->get('city')->getData();
				$repositoryCity = $this->getDoctrine()->getRepository('PouceSiteBundle:City');
				$country = $repositoryCity->findOneByName($town)->getCountry()->getName();

				$arrivee = $trajet->location($town,$country);
				$longArrivee = $arrivee[0]["lon"];
				$latArrivee = $arrivee[0]["lat"];

				//Calcule du trajet
				$distance=$trajet->calculDistance($user->getSchool()->getLongitude(),$user->getSchool()->getLatitude(),$longArrivee,$latArrivee);
				$result->getPosition()->setDistance($distance);
				$result->getPosition()->setLongitude($longArrivee);
				$result->getPosition()->setLatitude($latArrivee);

				//Enregistrement
				$em->persist($result);
				$em->flush();


				$request->getSession()->getFlashBag()->add('notice', 'Résultat bien enregistrée.');

				return $this->redirect($this->generateUrl('pouce_site_homepage'));
			}

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
		$comment = new Comment();

		// On crée le FormBuilder grâce au service form factory
		$formBuilder = $this->get('form.factory')->createBuilder('form', $comment);

		// On ajoute les champs de l'entité que l'on veut à notre formulaire
		$formBuilder
		  ->add('block',   'textarea', array(
				'attr'=> 	array(	'class'=>'js-st-instance',
									'name'=>'aventureForm'      			
							)
			))
		;
		// Pour l'instant, pas de candidatures, catégories, etc., on les gérera plus tard

		// À partir du formBuilder, on génère le formulaire
		$form = $formBuilder->getForm();

		if($request->getMethod() == 'POST'){
			$em = $this->getDoctrine()->getManager();
			$user = $this->getUser();
			$repository = $this->getDoctrine()->getRepository('PouceTeamBundle:Team');
			$team = $repository->getLastTeam($user->getId())->getSingleResult();
			$comment->setTeam($team);
			$comment->setBlock($request->request->get("aventureForm"));

			//Enregistrement
			$em->persist($comment);
			$em->flush();


		}
		return $this->render('PouceTeamBundle:Team:createComment.html.twig', array(
			'form'=>$form->createView(),
			));
	}

	/*
		Gere l'upload de photo en AJAX dans le formulaire de commentaire
	*/
	public function uploadPhotoAction(Request $request)
	{
		$user = $this->getUser();
		$repository = $this->getDoctrine()->getRepository('PouceTeamBundle:Team');
		$team = $repository->getLastTeam($user->getId())->getSingleResult();

		$em = $this->getDoctrine()->getManager();

		$image = new RecitImage();

		//exit(\Doctrine\Common\Util\Debug::dump($request->files->get("attachment")["file"]));

		$image->setImageFile($request->files->get("attachment")["file"]);

		$em->persist($image);
		$em->flush();

		//$imageSaved = $this->getDoctrine()->getRepository('PouceTeamBundle:RecitImage')->findOneByImageName($request->get("attachment")['uid']);

		$helper = $this->container->get('vich_uploader.templating.helper.uploader_helper');
		$path = $helper->asset($image, 'imageFile');

        $response = json_encode(array(
            'file' => array(
            	'url' => $path
            )
	    ));


    	return new JsonResponse($response);

		//return new Response(exit(\Doctrine\Common\Util\Debug::dump($response)));
	}

	/*
		Affiche juste la partie destination et commentaires (car déjà tout deux remplit)
	*/
	public function showResultAction($id)
	{
		$repositoryComment = $this
		  ->getDoctrine()
		  ->getManager()
		  ->getRepository('PouceTeamBundle:Comment')
		;

		$repositoryResult = $this
		  ->getDoctrine()
		  ->getManager()
		  ->getRepository('PouceTeamBundle:Result')
		;

		$comment = $repositoryComment->findOneByTeam($id);
		$result = $repositoryResult->findOneByTeam($id);

		// create a converter object and handle the input
		$converter = new Converter();
		$html = $converter->toHtml($comment->getBlock());

		return $this->render('PouceTeamBundle:Team:showResult.html.twig', array(
		  'html'	=> $html,
		  'result' 	=> $result
		));	
	}

	public function addPositionAction(Request $request)
	{ 
		$user = $this->getUser();
		$repository = $this->getDoctrine()->getRepository('PouceTeamBundle:Team');
		$team = $repository->getLastTeam($user->getId())->getSingleResult();

		$position= new Position();

		/// On crée le FormBuilder grâce au service form factory
		$form = $this->get('form.factory')->create(new PositionType(), $position);

		if ($request->isMethod('POST')) {
			$em = $this->getDoctrine()->getManager();

			$position->setTeam($team);
			$position->setEdition($team->getEdition());

			// Ajout d'un point dans la base de données et liaison résultat <-> Point
			$trajet = $this->container->get('pouce_team.trajet');
			$town=$request->request->get('fakeundefined');
			$country=$request->request->get('pays');

			$repositoryCity = $this->getDoctrine()->getManager()
			  ->getRepository('PouceSiteBundle:City');
			$repositoryCountry = $this->getDoctrine()->getManager()
			  ->getRepository('PouceSiteBundle:Country');
			$repositoryResult = $this->getDoctrine()->getManager()
			  ->getRepository('PouceTeamBundle:Result');

			$pays = $repositoryCountry->findOneBy(
				array('name' => $country)
				);

			if($pays!=NULL)
			{
				$paysId=$pays->getId();

				$ville = $repositoryCity->findOneBy(
					array(
						'name' => $town,
						'country' => $paysId
						)
					);
				if($ville == NULL)
				{
					return $this->render('PouceTeamBundle:Team:addPosition.html.twig', array(
						'form'=>$form->createView()
						));
				}
			}
			else
			{
				return $this->render('PouceTeamBundle:Team:addPosition.html.twig', array(
					'form'=>$form->createView()
					));
			}

			$position->setCity($ville);
			$position->setLongitude($ville->getLongitude());
			$position->setLatitude($ville->getLatitude());

			$longArrivee = $ville->getLongitude();
			$latArrivee = $ville->getLatitude();

			//Calcule du trajet
			$distance=$trajet->calculDistance($user->getSchool()->getLongitude(),$user->getSchool()->getLatitude(),$longArrivee,$latArrivee);

			$newResultFlag=0;

			// On cherche le record de la team (pour l'instant) s'il existe
			$result = $repositoryResult->findOneBy(
				array(
					'team' => $team->getId(),
					'edition' => $team->getEdition()
					)
				);

			if($result==NULL)
			{
				$result = new Result();
				$result->setTeam($team);
				$result->setEdition($team->getEdition());
				$result->setPosition($position);
				$result->setLateness(0);
				$result->setIsValid(true);
				$result->setRank(0);
				$newResultFlag=1;
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

			return $this->redirect($this->generateUrl('pouce_site_homepage'));
		}
		return $this->render('PouceTeamBundle:Team:addPosition.html.twig', array(
			'form'=>$form->createView()
			));
	}

	public function addPositionOfTeamAction($teamId, Request $request){
		$em = $this->getDoctrine()->getManager();
		$repository = $em->getRepository('PouceTeamBundle:Team');
		$team = $repository->find($teamId);
		$user = $em->getRepository('PouceUserBundle:User')->findAUserOfTeam($team);

		$position= new Position();

		/// On crée le FormBuilder grâce au service form factory
		$form = $this->get('form.factory')->create(new PositionType(), $position);

		if ($request->isMethod('POST')) {

			$position->setTeam($team);
			$position->setEdition($team->getEdition());

			// Ajout d'un point dans la base de données et liaison résultat <-> Point
			$trajet = $this->container->get('pouce_team.trajet');
			$town=$request->request->get('fakeundefined');
			$country=$request->request->get('pays');

			$repositoryCity = $this->getDoctrine()->getManager()
			  ->getRepository('PouceSiteBundle:City');
			$repositoryCountry = $this->getDoctrine()->getManager()
			  ->getRepository('PouceSiteBundle:Country');
			$repositoryResult = $this->getDoctrine()->getManager()
			  ->getRepository('PouceTeamBundle:Result');

			$pays = $repositoryCountry->findOneBy(
				array('name' => $country)
				);

			if($pays!=NULL)
			{
				$paysId=$pays->getId();

				$ville = $repositoryCity->findOneBy(
					array(
						'name' => $town,
						'country' => $paysId
						)
					);
				if($ville == NULL)
				{
					return $this->render('PouceTeamBundle:Team:addPositionSpecificTeam.html.twig', array(
						'form'=>$form->createView(),
						'team' => $team
						));
				}
			}
			else
			{
				return $this->render('PouceTeamBundle:Team:addPositionSpecificTeam.html.twig', array(
					'form'=>$form->createView(),
					'team' => $team
					));
			}

			$position->setCity($ville);
			$position->setLongitude($ville->getLongitude());
			$position->setLatitude($ville->getLatitude());

			$longArrivee = $ville->getLongitude();
			$latArrivee = $ville->getLatitude();

			//Calcule du trajet
			$distance=$trajet->calculDistance($user->getSchool()->getLongitude(),$user->getSchool()->getLatitude(),$longArrivee,$latArrivee);

			$newResultFlag=0;

			// On cherche le record de la team (pour l'instant) s'il existe
			$result = $repositoryResult->findOneBy(
				array(
					'team' => $team->getId(),
					'edition' => $team->getEdition()
					)
				);

			if($result==NULL)
			{
				$result = new Result();
				$result->setTeam($team);
				$result->setEdition($team->getEdition());
				$result->setPosition($position);
				$result->setLateness(0);
				$result->setIsValid(true);
				$result->setRank(0);
				$newResultFlag=1;
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

			return $this->redirect($this->generateUrl('pouce_site_checkParticipants', array('editionId' => $team->getEdition()->getId() )));
		}
		return $this->render('PouceTeamBundle:Team:addPositionSpecificTeam.html.twig', array(
			'form'=>$form->createView(),
			'team' => $team
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

	/**
	*	Donne le résultat et propose de le modifier si besoin. 
	*	S'il n'y a pas encore de résultat rentré, cela met un lien vers le formulaire d'ajout de résultat
	*/
	public function mainPageResultsAction()
	{
		$user=$this->getUser();
		$repository = $this->getDoctrine()->getRepository('PouceTeamBundle:Team');
		$resultRepo = $this->getDoctrine()->getRepository('PouceTeamBundle:Result');
		$team=$repository->getLastTeam($user->getId())->getSingleResult();
		$result=$resultRepo->getResultTeam($team)->getSingleResult();

		// On récupère le service
		$resultService = $this->container->get('pouce_team.team');

		if($resultService->isResultSet($team))
		{
			if($resultService->isResultSetCompletely($team))
			{
				return $this->render('PouceUserBundle:User:showResults.html.twig', array(
					'team'		=> $team,
					'result'	=> $result
				));
			}
			else
			{
				return $this->render('PouceUserBundle:User:showResultsAndLinkToCompleteResults.html.twig', array(
					'team'		=> $team,
					'result'	=> $result
				));
			}
		}
		else
		{
			return $this->render('PouceUserBundle:User:linkToAddResults.html.twig');
		}
	}

}
