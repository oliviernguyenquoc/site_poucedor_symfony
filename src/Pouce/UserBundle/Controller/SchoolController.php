<?php

namespace Pouce\UserBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

use Pouce\UserBundle\Entity\School;

use Pouce\UserBundle\Form\Type\SchoolType;
use Pouce\UserBundle\Form\Type\SchoolEditType;

class SchoolController extends Controller
{
    public function addSchoolAction(Request $request)
    {
        $school = new School();

        // On crée le FormBuilder grâce au service form factory
        $form = $this->get('form.factory')->create(new SchoolType());

        if ($request->getMethod() == 'POST') {
            if ($form->handleRequest($request)->isValid()) {

                $em = $this->getDoctrine()->getManager();
                
                $em->persist($school);
                $em->flush();
                
                return $this->redirect($this->generateUrl('pouce_site_config'));
            }
        }

        // On passe la méthode createView() du formulaire à la vue
        // afin qu'elle puisse afficher le formulaire toute seule
        return $this->render('PouceSuperAdminBundle:Admin:editSchool.html.twig', array(
          'form' => $form->createView()
        ));
    }

    public function editSchoolAction($id, Request $request)
    {
        $em = $this->getDoctrine()->getManager();
        $school = $em ->getRepository('PouceUserBundle:School')->find($id);
    
        $form = $this->get('form.factory')->create(new SchoolEditType(), $school);

        if($request->getMethod() == 'POST') {
            $form->bind($request);

            if($form->isValid()){
                //On enregistre la team
                $em->persist($school);
                $em->flush();

                return $this->redirect($this->generateUrl('pouce_site_config'));
            }
        }
        return $this->render('PouceSuperAdminBundle:Admin:editSchool.html.twig', array(
          'form'        => $form->createView(),
          'school'   => $school
        ));
    }

}
