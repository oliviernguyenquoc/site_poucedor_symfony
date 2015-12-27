<?php

namespace Pouce\SiteBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Doctrine\ORM\NoResultException;

use Pouce\SuperAdminBundle\Form\Type\EditionType;
use Pouce\SuperAdminBundle\Form\Type\EditionEditType;

use Pouce\SiteBundle\Entity\Edition;
use Pouce\TeamBundle\Entity\Position;
use Pouce\TeamBundle\Entity\Result;

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

}
