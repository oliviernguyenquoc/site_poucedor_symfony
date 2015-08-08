<?php

namespace Pouce\UserBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;

class UserType extends AbstractType
{
    /**
     * @param FormBuilderInterface $builder
     * @param array $options
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
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
                    'Homme' => 'Homme',
                    'Femme' => 'Femme'
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
    }
    
    /**
     * @param OptionsResolverInterface $resolver
     */
    public function setDefaultOptions(OptionsResolverInterface $resolver)
    {
        $resolver->setDefaults(array(
            'data_class' => 'Pouce\UserBundle\Entity\User',
            'validation_groups' => array('updateRegistration')
        ));
    }

    /**
     * @return string
     */
    public function getName()
    {
        return 'pouce_userbundle_user';
    }
}
