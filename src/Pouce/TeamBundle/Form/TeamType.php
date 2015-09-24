<?php

namespace Pouce\TeamBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;

use Pouce\UserBundle\Entity\User;
use Pouce\UserBundle\Entity\School;

class TeamType extends AbstractType
{
    private $schoolId, $userYear;

    public function __construct( School $school, User $user)
    {
        $userYear=$user->getLastLogin()->format('Y');
        $schoolId=$school->getId();
        $userId=$user->getId();

        $this->schoolId = $schoolId;
        $this->userYear = $userYear;
        $this->userId = $userId;
    }


    /**
     * @param FormBuilderInterface $builder
     * @param array $options
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $schoolId = $this->schoolId;
        $userYear = $this->userYear;
        $userId = $this->userId;

        $builder
            ->add('teamName', 'text', array(
                'label'=> 'Nom de l\'équipe',
                'required'    => true
            ))
            ->add('targetDestination','text', array(
                'label'=> 'Jusqu\'où pensez vous arrivez',
                'required'    => true
            ))
            ->add('comment', 'textarea', array(
                'required'    => true,
                'label' => 'Un commentaire'
            ))
            ->add('users','entity', array(
                'class'=>'PouceUserBundle:User',
                'label' => 'Co-équipié',
                'property'=>'completeName',
                //La liste des participants proposés sont toutes les personnes s'étant connecté ou inscrit cette année, n'ayant pas d'équipe
                'query_builder' => function(\Pouce\UserBundle\Entity\UserRepository $er) use($schoolId,$userYear,$userId) {
                    return $er-> getAllFreeUsersInSchool($schoolId,$userYear,$userId);
                },
                'required'  => true,
                "multiple" => false,
            ))
            ;
    }
    
    /**
     * @param OptionsResolverInterface $resolver
     */
    public function setDefaultOptions(OptionsResolverInterface $resolver)
    {
        $resolver->setDefaults(array(
            'data_class' => 'Pouce\TeamBundle\Entity\Team'
        ));
    }

    /**
     * @return string
     */
    public function getName()
    {
        return 'pouce_teambundle_team';
    }
}
