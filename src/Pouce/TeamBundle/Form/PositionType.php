<?php

namespace Pouce\TeamBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;
use Symfony\Component\Form\Extension\Core\DataTransformer\IntegerToLocalizedStringTransformer;

use Pouce\TeamBundle\Entity\Position;

class PositionType extends AbstractType
{
    /**
     * @param FormBuilderInterface $builder
     * @param array $options
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            // ->add('country','entity', array(
            //     'class'     => 'PouceSiteBundle:Country',
            //     'property'  => 'name', 
            //     'label'     => 'Pays',
            //     'required'  => true,
            //     'multiple' => false
            // ))
            ->add('city', 'autocomplete', array(
                'class' => 'PouceSiteBundle:City',
                'required'  => true
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
