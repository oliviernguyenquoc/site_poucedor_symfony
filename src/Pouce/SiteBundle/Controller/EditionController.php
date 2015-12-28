<?php

namespace Pouce\SiteBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;

use Pouce\SuperAdminBundle\Form\Type\EditionType;
use Pouce\SuperAdminBundle\Form\Type\EditionEditType;

use Pouce\SiteBundle\Entity\Edition;

class EditionController extends Controller
{
    public function addEditionAction(Request $request)
    {
        $edition = new Edition();

        // On crée le FormBuilder grâce au service form factory
        $form = $this->get('form.factory')->create(new EditionType());

        if ($request->getMethod() == 'POST') {
            if ($form->handleRequest($request)->isValid()) {

                $em = $this->getDoctrine()->getManager();

                $edition->setStatus("scheduled");
                
                $em->persist($edition);
                $em->flush();
                
                return $this->redirect($this->generateUrl('pouce_site_config'));
            }
        }

        // On passe la méthode createView() du formulaire à la vue
        // afin qu'elle puisse afficher le formulaire toute seule
        return $this->render('PouceSuperAdminBundle:Admin:addEdition.html.twig', array(
          'form' => $form->createView()
        ));
    }

    public function editEditionAction($id, Request $request)
    {
        $em = $this->getDoctrine()->getManager();
        $edition = $em ->getRepository('PouceSiteBundle:Edition')->find($id);
    
        $form = $this->get('form.factory')->create(new EditionEditType(), $edition);

        if($request->getMethod() == 'POST') {
            $form->bind($request);

            if($form->isValid()){
                //On enregistre la team
                $em->persist($edition);
                $em->flush();

                return $this->redirect($this->generateUrl('pouce_site_config'));
            }
        }
        return $this->render('PouceSuperAdminBundle:Admin:editEdition.html.twig', array(
          'form'        => $form->createView(),
          'editionId'   => $id
        ));
    }

    public function fowardStepEditionAction($editionId, Request $request)
    {
        $em = $this->getDoctrine()->getManager();
        $edition = $em ->getRepository('PouceSiteBundle:Edition')->find($editionId);
        $status = $edition->getStatus();

        if($status=="scheduled")
        {
            $edition->setStatus("registering");
        }
        elseif($status=="registering") {
            $edition->setStatus("inProgress");
        }
        elseif($status=="inProgress"){
            $edition->setStatus("finished");
        }

        $em->persist($edition);
        $em->flush();

        return $this->redirect($this->generateUrl('pouce_site_config'));
    }

    public function backwardStepEditionAction($editionId, Request $request)
    {
        $em = $this->getDoctrine()->getManager();
        $edition = $em ->getRepository('PouceSiteBundle:Edition')->find($editionId);
        $status = $edition->getStatus();

        if($status=="finished")
        {
            $edition->setStatus("inProgress");
        }
        elseif($status=="inProgress") {
            $edition->setStatus("registering");
        }
        elseif($status=="registering"){
            $edition->setStatus("scheduled");
        }

        $em->persist($edition);
        $em->flush();

        return $this->redirect($this->generateUrl('pouce_site_config'));
    }
}
