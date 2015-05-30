<?php

namespace Pouce\TeamBundle\Controller;

use Pouce\TeamBundle\Entity\Team;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;

class TeamController extends Controller
{
	public function addAction(Request $request)
  	{
	    // On crée un objet Advert
	    $team = new Team();

	    // On crée le FormBuilder grâce au service form factory
	    $formBuilder = $this->get('form.factory')->createBuilder('form', $team);

	    // On ajoute les champs de l'entité que l'on veut à notre formulaire
	    $formBuilder
	    	->add('teamName', 'text', array(
                'label'=> 'Nom de l\'équipe',
                'required'    => true
            ))
            ->add('targetDestination' ,'text', array(
                'label'=> 'Jusqu\'où pensez vous arrivez',
                'required'    => true
            ))
            ->add('comment', 'textarea', array(
	            'required'    => true,
	            'label' => 'Un commentaire'
            ));
	    // Pour l'instant, pas de candidatures, catégories, etc., on les gérera plus tard

	    // À partir du formBuilder, on génère le formulaire
	    $form = $formBuilder->getForm();

	    // On passe la méthode createView() du formulaire à la vue
	    // afin qu'elle puisse afficher le formulaire toute seule
	    return $this->render('PouceTeamBundle:Team:add.html.twig', array(
	      'teamForm' => $form->createView(),
	    ));
	 }
}
