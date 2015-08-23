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
            ->add('promotion', 'choice', array(
                'choices' => array(
                    "Licence 1"                                            => "Bac +1", 
                    "Licence 2"                                            => "Bac +2", 
                    "Licence 3"                                            => "Bac +3", 
                    "Master 1"                                             => "Bac +4", 
                    "Master 2"                                             => "Bac +4", 
                    "Mastère spécialisé"                                   => "Bac +6",
                    "Doctorant"                                            => "Doctorant",
                    "1ère année de prépa"                                  => "Bac +1",
                    "2ème année de prépa (3/2)"                            => "Bac +2",
                    "3ème année de prépa (5/2)"                            => "Bac +3",
                    "1ère année d'école (cycle ingénieur/manageur)"        => "Bac +3",
                    "2ème année d'école (cycle ingénieur/manageur)"        => "Bac +4",
                    "3ème année d'école (cycle ingénieur/manageur)"        => "Bac +5"
                ),
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
