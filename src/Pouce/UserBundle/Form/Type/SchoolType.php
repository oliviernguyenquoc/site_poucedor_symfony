<?php

namespace Pouce\UserBundle\Form\Type;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;

class SchoolType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('name', 'text', array(
                'label'     => 'Nom de l\'école',
                'attr'      => array('maxlength' => 255),
                'required'  => true
            ))
            ->add('sigle', 'text', array(
                'label'=> 'Sigle de l\'école',
                'attr'      => array('maxlength' => 10),
                'required'    => false
            ))            
            ->add('telephone', 'text', array(
                'label'=> 'Téléphone de l\'école',
                'attr'      => array('maxlength' => 20),
                'required'    => false
            ))
            ->add('address', 'text', array(
                'label'=> 'Rue/Avenue de l\'école',
                'attr'      => array('maxlength' => 255),
                'required'    => true
            ))
            ->add('city', 'autocomplete', array(
                'class' => 'PouceSiteBundle:City',
                'required'  => true
            ))
            ;
    }

    /**
     * @return string
     */
    public function getName()
    {
        return 'pouce_user_school';
    }
}
