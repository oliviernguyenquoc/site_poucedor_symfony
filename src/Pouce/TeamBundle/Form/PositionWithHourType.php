<?php

namespace Pouce\TeamBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;

class PositionWithHourType extends AbstractType
{
    /**
     * @param FormBuilderInterface $builder
     * @param array $options
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            -> add('city', 'autocomplete', array(
                'class' => 'PouceSiteBundle:City',
                'required'  => true
            ))

            -> add('created', 'datetime', array(
            'input'  => 'datetime',
            'widget' => 'choice'
        ))
            
            ;
    }
    
    /**
     * @param OptionsResolverInterface $resolver
     */
    public function setDefaultOptions(OptionsResolverInterface $resolver)
    {
        $resolver->setDefaults(array(
            'data_class' => 'Pouce\TeamBundle\Entity\Position'
        ));
    }

    /**
     * @return string
     */
    public function getName()
    {
        return 'pouce_teambundle_position';
    }
}
