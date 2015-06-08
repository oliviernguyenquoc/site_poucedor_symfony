<?php

namespace Pouce\TeamBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;

class TeamType extends AbstractType
{
    /**
     * @param FormBuilderInterface $builder
     * @param array $options
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $user = $this->getUser();
        $school =$user->getSchool();

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
                'query_builder' => function(\Pouce\UserBundle\Entity\UserRepository $er) use($year) {
                    return $er-> getAllUsersInSchool($school->getId(),date("Y",$user->getLastLogin());
                },
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
