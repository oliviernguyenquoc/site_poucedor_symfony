<?php

namespace Pouce\UserBundle\Controller;

use Pouce\UserBundle\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class UserController extends Controller
{
	public function addInformationAction(Request $request)
  	{
	    // On crée un objet Advert
	    $user = new User();

	    // On crée le FormBuilder grâce au service form factory
	    $formBuilder = $this->get('form.factory')->createBuilder('form', $user);

	    // On ajoute les champs de l'entité que l'on veut à notre formulaire
	    $formBuilder
	    	->add('first_name', 'text', array(
                'label'=> 'Prénom :',
                'required'    => true
            ))
            ->add('last_name' ,'text', array(
                'label'=> 'Nom :',
                'required'    => true
            ))
            ->add('sex', 'choice', array(
                'choices' => array(
                    'M' => 'Masculin',
                    'F' => 'Féminin'
	            ),
	            'required'    => true,
	            'empty_value' => 'Choisissez votre sexe',
	            'empty_data'  => null,
	            'label' => 'Sexe :'
            ))
            ->add('promotion', 'text', array(
                'label'=> 'Promotion :',
                'required'    => true
            ))
            ->add('telephone', 'text', array(
                'label'=> 'Numéro de téléphone :',
                'required'    => true
            ));
	    // Pour l'instant, pas de candidatures, catégories, etc., on les gérera plus tard

	    // À partir du formBuilder, on génère le formulaire
	    $form = $formBuilder->getForm();

	    // On passe la méthode createView() du formulaire à la vue
	    // afin qu'elle puisse afficher le formulaire toute seule
	    return $this->render('PouceTeamBundle:Team:add.html.twig', array(
	      'userForm' => $form->createView(),
	    ));
	 }
}
