<?php

namespace Pouce\UserBundle\Form\Type;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;
use Symfony\Component\Form\Extension\Core\ChoiceList\ChoiceList;
 
use Doctrine\ORM\EntityRepository;

class RegistrationFormType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('first_name', 'text', array(
                'label'=> 'Prénom',
                'required'    => true
            ))
            ->add('last_name' ,'text', array(
                'label'=> 'Nom',
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
                'label' => 'Sexe'
            ))
            ->add('school', 'entity', array(
                'class' => 'PouceUserBundle:School',
                'empty_value' => 'Choisissez votre université ou école',
                'property' => 'name',
                'label' => 'Ecole/Université',
                'query_builder' => function(\Pouce\UserBundle\Entity\SchoolRepository $er) use($year) {
                    return $er-> getAllSchoolParticipate($year);
                },
            ))
            ->add('promotion', 'choice', array(
                'choice_list' => new ChoiceList(
                    array("Bac +1"      , "Bac +2"      , "Bac +3"      , "Bac +4"  , "Bac +5"  , "Bac +6"              , "Doctorant", "Bac +1"             , "Bac +2"                      , "Bac +3"                      , "Bac +3"                                          , "Bac +4"                                          , "Bac +5"                                          ),  
                    array("Licence 1"   , "Licence 2"   , "Licence 3"   , "Master 1", "Master 2", "Mastère spécialisé"  , "Doctorant", "1ère année de prépa", "2ème année de prépa (3/2)"   , "3ème année de prépa (5/2)"   , "1ère année d'école (cycle ingénieur/manageur)"   , "2ème année d'école (cycle ingénieur/manageur)"   , "3ème année d'école (cycle ingénieur/manageur)"   )
                ),
                'label'=> 'Promotion',
                'required'    => true,
                'empty_value' => 'Choisissez votre promotion',
                'empty_data'  => null
            ))
            ->add('telephone', 'text', array(
                'label'=> 'Numéro de téléphone',
                'required'    => true
            ));
    }

    public function getParent()
    {
        return 'fos_user_registration';
    }

    public function getName()
    {
        return 'pouce_user_registration';
    }
}
