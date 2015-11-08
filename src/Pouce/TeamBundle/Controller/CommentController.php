<?php

namespace Pouce\TeamBundle\Controller;

use Pouce\TeamBundle\Entity\Comment;
use Pouce\TeamBundle\Entity\RecitImage;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class CommentController extends Controller
{
	/*
		Creer le formulaire de commentaire sans la partie sur la destination (car déj)à remplit)
	*/
	public function createCommentAction($editionId, Request $request)
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
			$repository = $em->getRepository('PouceTeamBundle:Team');

			$user = $this->getUser();
			$team = $repository->findOneTeamByEditionAndUsers($editionId, $user->getId())->getSingleResult();
			$comment->setBlock($request->request->get("aventureForm"));
			$result = $team->getResult();
			$result->setComment($comment);

			$em->persist($comment);
			$em->flush();

			return $this->redirect($this->generateUrl('pouce_user_mainpage'));


		}
		return $this->render('PouceTeamBundle:Team:createComment.html.twig', array(
			'form'		=> $form->createView(),
			'editionId'	=> $editionId
			));
	}

	public function editCommentAction($editionId, Request $request)
	{
		$em = $this->getDoctrine()->getManager();
		$repository = $em->getRepository('PouceTeamBundle:Team');

		$user = $this->getUser();
		$team = $repository->findOneTeamByEditionAndUsers($editionId, $user->getId())->getSingleResult();
		$result = $team->getResult();
		$comment = $result->getComment();

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
			$comment->setBlock($request->request->get("aventureForm"));
			$result->setComment($comment);


			//Enregistrement
			$em->flush();

			return $this->redirect($this->generateUrl('pouce_user_mainpage'));

		}
		return $this->render('PouceTeamBundle:Team:editComment.html.twig', array(
			'form'		=> $form->createView(),
			'editionId'	=> $editionId,
			'comment' => $comment
			));
	}

	public function editCommentAdminAction($teamId, Request $request)
	{
		$em = $this->getDoctrine()->getManager();
		$repository = $em->getRepository('PouceTeamBundle:Team');

		$team = $repository->find($teamId);
		$result = $team->getResult();
		$comment = $result->getComment();

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
			$comment->setBlock($request->request->get("aventureForm"));
			$result->setComment($comment);


			//Enregistrement
			$em->flush();

			return $this->redirect($this->generateUrl('pouce_site_homepage'));

		}
		return $this->render('PouceTeamBundle:Team:editCommentAdmin.html.twig', array(
			'form'		=> $form->createView(),
			'teamId'	=> $teamId,
			'comment' => $comment
			));
	}

	/*
		Gere l'upload de photo en AJAX dans le formulaire de commentaire
	*/
	public function uploadPhotoAction($editionId, Request $request)
	{
		$em = $this->getDoctrine()->getManager();
		$repository = $em->getRepository('PouceTeamBundle:Team');

		$user = $this->getUser();
		$team = $repository->findOneTeamByEditionAndUsers($editionId, $user->getId())->getSingleResult();
		$comment = $team->getResult()->getComment();
	
		$image = new RecitImage();
		$image->setImageFile($request->files->get("attachment")["file"]);
		$image->setComment($comment);

		$em->persist($image);
		$em->flush();

		$helper = $this->container->get('vich_uploader.templating.helper.uploader_helper');
		$path = $helper->asset($image, 'imageFile');
        $response = json_encode(array(
            'file' => array(
            	'url' => '/web'.$path
            )
	    ));
	    
    	return new Response($response);
	}


	/*
		Gere l'upload de photo en AJAX dans le formulaire de commentaire de la part des admins
	*/
	public function uploadPhotoAdminAction($teamId, Request $request)
	{
		$em = $this->getDoctrine()->getManager();

		$repository = $em->getRepository('PouceTeamBundle:Team');

		$team = $repository->find($teamId);
		$comment = $team->getResult()->getComment();		

		$image = new RecitImage();
		$image->setImageFile($request->files->get("attachment")["file"]);
		$image->setComment($comment);

		$em->persist($image);
		$em->flush();

		$helper = $this->container->get('vich_uploader.templating.helper.uploader_helper');
		$path = $helper->asset($image, 'imageFile');

        $response = json_encode(array(
            'file' => array(
            	'url' => '/web'.$path
            )
	    ));
	    
    	return new Response($response);
	}
}
