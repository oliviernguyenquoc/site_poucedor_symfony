<?php

namespace Pouce\TeamBundle\Controller;

use Pouce\TeamBundle\Entity\Comment;
use Pouce\TeamBundle\Entity\Result;
use Pouce\UserBundle\Entity\User;
use Pouce\TeamBundle\Form\ResultType;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;

class ResultController extends Controller
{
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
		  	$team=$repository->getLastTeam($user->getId());

		  	$result = new Result();
			// On crée le FormBuilder grâce au service form factory
		    $form = $this->get('form.factory')->create(new ResultType(), $result);

		    if ($form->handleRequest($request)->isValid()) {

				$em = $this->getDoctrine()->getManager();
				$result->setTeam($team);
				$result->getPosition()->setTeam($team);
				$result->getPosition()->setEdition($team->getEdition());
				$result->setEdition($team->getEdition());
				$result->setTeam($team);

				// Ajout d'un point dans la base de données et liasion résultat <-> Point
    			$trajet = $this->container->get('pouce_team.trajet');
    			$town=$form->get('position')->get('town')->getData();
    			$country=$form->get('position')->get('country')->getData();
    			$arrivee=$trajet->location($town,$country);
    			$longArrivee=$arrivee[0]["lon"];
    			$latArrivee=$arrivee[0]["lat"];

				//Calcule du trajet
    			$distance=$trajet->calculDistance($user->getSchool()->getLongitude(),$user->getSchool()->getLatitude(),$longArrivee,$latArrivee);
    			$result->getPosition()->setDistance($distance);

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
			exit(\Doctrine\Common\Util\Debug::dump($result));
			return $this->redirect($this->generateUrl('pouce_user_addinformations'));
  		}
  		
	}


	/*
		Creer le formulaire de commentaire sans la partie sur la destination (car déj)à remplit)
	*/
	public function createCommentAction(Request $request)
	{
		$comment= new Comment();

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
			$user=$this->getUser();
			$repository = $this->getDoctrine()->getRepository('PouceTeamBundle:Team');
			$team=$repository->getLastTeam($user->getId());
			$comment->setTeam($team);
			$comment->setBlock($_POST['aventureForm']);

			//Enregistrement
			// $em->persist($comment);
			// $em->flush();

			exit(\Doctrine\Common\Util\Debug::dump($_POST['aventureForm']));
		}
	    return $this->render('PouceTeamBundle:Team:createComment.html.twig', array(
	    	'form'=>$form->createView(),
	    	));
	}

	/*
		Affiche juste la partie destination et commentaires (car déjà tout deux remplit)
	*/
	public function showResultAction(Request $request)
	{
  	    return $this->render('PouceTeamBundle:Team:showResult.html.twig', array(
	      'result' => $result,
	    ));	}
}
