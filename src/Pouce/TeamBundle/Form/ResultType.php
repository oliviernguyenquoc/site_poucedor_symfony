<?php

namespace Pouce\TeamBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;

use Pouce\TeamBundle\Entity\Result;

class ResultType extends AbstractType
{
    /**
     * @param FormBuilderInterface $builder
     * @param array $options
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('town', 'text', array(
                'label'=> 'Ville',
                'required'    => true
            ))
            ->add('country','text', array(
                'label'=> 'Pays',
                'required'    => true
            ))
            ->add('isValid', 'checkbox', array(
                'required'    => true
            ))
            ->add('lateness','number', array(
                'precision' => 0,
                'rounding_mode' => IntegerToLocalizedStringTransformer::ROUND_UP
            ))
            ;
    }
    
    /**
     * @param OptionsResolverInterface $resolver
     */
    public function setDefaultOptions(OptionsResolverInterface $resolver)
    {
        $resolver->setDefaults(array(
            'data_class' => 'Pouce\TeamBundle\Entity\Result'
        ));
    }

    /**
     * @return string
     */
    public function getName()
    {
        return 'pouce_teambundle_result';
    }
}
